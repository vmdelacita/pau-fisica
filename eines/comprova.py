#!/usr/bin/env python3
"""Valida i previsualitza exercicis de la base de dades.

  comprova.py CARPETA [CARPETA ...]   valida i compila els exercicis indicats
  comprova.py --tot                   tots els de base_dades/exercicis/
Opcions:
  --sense-compilar   només valida metadades i fitxers
  --png              a més del PDF, renderitza les pàgines a PNG (per revisar-les)

La previsualització queda a base_dades/_build/<id>/previsualitzacio.pdf
"""
import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

import yaml

ARREL = Path(__file__).resolve().parent.parent
EXERCICIS = ARREL / "base_dades" / "exercicis"
BUILD = ARREL / "base_dades" / "_build"
EINES = ARREL / "eines"

TAXO = yaml.safe_load((EINES / "taxonomia.yaml").read_text(encoding="utf-8"))
TOTS_SUBTEMES = {s for llista in TAXO["blocs"].values() for s in llista}

OBLIGATORIS = ["id", "titol", "resum", "font", "format", "curriculum", "bloc", "subtemes",
               "paraules_clau", "tipus", "dificultat", "justificacio_dificultat",
               "punts_total", "apartats", "figures", "revisat"]
CURRICULUM = ("actual", "parcial", "antic")
FONT_OBLIGATORIS = ["tipus", "any", "convocatoria", "serie", "exercici", "opcio",
                    "pdf_enunciat", "pagines_enunciat", "pdf_solucio", "pagines_solucio"]
PROHIBITS = [r"\\documentclass", r"\\begin\{document\}", r"\\usepackage",
             r"\\section", r"\\input", r"\\includegraphics"]
RE_ID = re.compile(r"^[a-z0-9]+(_[A-Za-z0-9-]+)+$")


def valida(carpeta: Path):
    errors, avisos = [], []
    meta_f = carpeta / "metadades.yaml"
    if not meta_f.exists():
        return None, [f"falta metadades.yaml"], []
    try:
        m = yaml.safe_load(meta_f.read_text(encoding="utf-8"))
    except yaml.YAMLError as e:
        return None, [f"metadades.yaml no és YAML vàlid: {e}"], []

    for k in OBLIGATORIS:
        if k not in m:
            errors.append(f"falta la clau '{k}'")
    if errors:
        return m, errors, avisos

    if m["id"] != carpeta.name:
        errors.append(f"id '{m['id']}' != nom de carpeta '{carpeta.name}'")
    if not RE_ID.match(carpeta.name):
        errors.append(f"nom de carpeta no vàlid (lletres sense accents, xifres, '-' i '_'): {carpeta.name}")

    for k in FONT_OBLIGATORIS:
        if k not in (m["font"] or {}):
            errors.append(f"falta font.{k}")
    for k in ("pdf_enunciat", "pdf_solucio"):
        p = (m["font"] or {}).get(k)
        if p and not (ARREL / p).exists():
            errors.append(f"font.{k} no existeix: {p}")

    if m["format"] not in ("nou", "antic"):
        errors.append("format ha de ser 'nou' o 'antic'")
    if m["curriculum"] not in CURRICULUM:
        errors.append(f"curriculum ha de ser un de {', '.join(CURRICULUM)}")
    elif m["curriculum"] != "actual" and not (m.get("notes") or "").strip():
        errors.append("curriculum parcial o antic: cal explicar a 'notes' què queda fora del currículum")
    if m["bloc"] not in TAXO["blocs"]:
        errors.append(f"bloc desconegut: {m['bloc']}")
    for b in m.get("blocs_secundaris") or []:
        if b not in TAXO["blocs"]:
            errors.append(f"bloc secundari desconegut: {b}")
    if not m["subtemes"]:
        errors.append("cal almenys un subtema")
    for s in m["subtemes"] or []:
        if s not in TOTS_SUBTEMES:
            errors.append(f"subtema desconegut: {s}")
    for t in m["tipus"] or []:
        if t not in TAXO["tipus"]:
            errors.append(f"tipus desconegut: {t}")
    if not isinstance(m["dificultat"], int) or not 1 <= m["dificultat"] <= 5:
        errors.append("dificultat ha de ser un enter de 1 a 5")
    if not m["paraules_clau"]:
        errors.append("cal almenys una paraula clau")

    apartats = m["apartats"] or []
    try:
        suma = sum(float(a["punts"]) for a in apartats)
        if abs(suma - float(m["punts_total"])) > 1e-6:
            errors.append(f"la suma de punts dels apartats ({suma}) != punts_total ({m['punts_total']})")
    except (KeyError, TypeError, ValueError):
        errors.append("cada apartat necessita 'etiqueta' i 'punts' numèrics")

    enun_f, sol_f = carpeta / "enunciat.tex", carpeta / "solucio.tex"
    for f in (enun_f, sol_f):
        if not f.exists():
            errors.append(f"falta {f.name}")
    if errors:
        return m, errors, avisos

    enun = enun_f.read_text(encoding="utf-8")
    sol = sol_f.read_text(encoding="utf-8")
    for nom, txt in (("enunciat.tex", enun), ("solucio.tex", sol)):
        for pat in PROHIBITS:
            if re.search(pat, txt):
                errors.append(f"{nom} conté {pat.replace(chr(92)*2, chr(92))} (no permès en un fragment)")
    n_ap = len(re.findall(r"\\begin\{apartat\}", enun))
    n_sol = len(re.findall(r"\\begin\{solapartat\}", sol))
    if n_ap != len(apartats):
        errors.append(f"enunciat.tex té {n_ap} apartats però metadades en diu {len(apartats)}")
    if n_sol != len(apartats):
        errors.append(f"solucio.tex té {n_sol} solapartat però metadades en diu {len(apartats)}")

    usades = set(re.findall(r"\\figura(?:\[[^\]]*\])?\{([^}]+)\}", enun + sol))
    for u in usades:
        if not (carpeta / u).exists():
            errors.append(f"figura referenciada que no existeix: {u}")
    declarades = {f["fitxer"] for f in (m["figures"] or [])}
    for png in carpeta.glob("*.png"):
        if png.name not in usades:
            avisos.append(f"{png.name} no s'utilitza a cap .tex")
        if png.name not in declarades:
            avisos.append(f"{png.name} no és a la llista 'figures' de metadades")
    return m, errors, avisos


def escapa(s):
    rep = {"\\": r"\textbackslash{}", "&": r"\&", "%": r"\%", "$": r"\$", "#": r"\#",
           "_": r"\_", "{": r"\{", "}": r"\}", "~": r"\textasciitilde{}", "^": r"\^{}"}
    return "".join(rep.get(c, c) for c in str(s))


def compila(carpeta: Path, m, png=False):
    dest = BUILD / carpeta.name
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True)
    (dest / "ex").symlink_to(carpeta.resolve())
    shutil.copy(EINES / "preambul_exercicis.tex", dest / "preambul_exercicis.tex")
    f = m["font"]
    peu = (f"{f['tipus']} / {f['any']} / {f['convocatoria']} / sèrie {f['serie']} / "
           f"exercici {f['exercici']}{(' opció ' + str(f['opcio'])) if f['opcio'] else ''}")
    doc = rf"""\documentclass[a4paper,11pt]{{article}}
\usepackage[margin=1.8cm]{{geometry}}
\usepackage[catalan]{{babel}}
\input{{preambul_exercicis.tex}}
\def\exdir{{ex}}
\setlength{{\parindent}}{{0pt}}
\begin{{document}}
{{\Large\bfseries {escapa(m['titol'])}}}\par
{{\small\ttfamily {escapa(m['id'])}}}\par
{{\small {escapa(peu)} / {escapa(m['bloc'])} / dificultat {m['dificultat']}}}\par
\medskip\hrule\medskip
\input{{ex/enunciat.tex}}
\bigskip\hrule\medskip
{{\large\bfseries Solució (pauta)}}\par
\input{{ex/solucio.tex}}
\end{{document}}
"""
    (dest / "main.tex").write_text(doc, encoding="utf-8")
    r = subprocess.run(["tectonic", "--keep-logs", "main.tex"], cwd=dest,
                       capture_output=True, text=True)
    sortida = r.stdout + r.stderr
    problemes = [l for l in sortida.splitlines()
                 if l.startswith("error") or "Undefined control sequence" in l
                 or "Overfull \\hbox" in l and "too wide" in l]
    pdf = dest / "main.pdf"
    if r.returncode != 0 or not pdf.exists():
        return None, ["compilació fallida:"] + sortida.splitlines()[-25:]
    final = dest / "previsualitzacio.pdf"
    pdf.rename(final)
    if png:
        import fitz
        d = fitz.open(final)
        for i, p in enumerate(d, 1):
            p.get_pixmap(dpi=90).save(dest / f"pagina-{i}.png")
    # avisos de caixes massa amples (fórmules que surten del marge)
    log = dest / "main.log"
    if log.exists():
        for l in log.read_text(encoding="utf-8", errors="replace").splitlines():
            mo = re.match(r"Overfull \\hbox \(([\d.]+)pt too wide\)", l)
            if mo and float(mo.group(1)) > 10:
                problemes.append(l.strip())
    return final, problemes


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("carpetes", nargs="*")
    ap.add_argument("--tot", action="store_true")
    ap.add_argument("--sense-compilar", action="store_true")
    ap.add_argument("--png", action="store_true")
    a = ap.parse_args()

    if a.tot:
        carpetes = sorted(p for p in EXERCICIS.iterdir() if p.is_dir())
    else:
        carpetes = [Path(c).resolve() for c in a.carpetes]
    if not carpetes:
        ap.error("cap carpeta")

    n_err = 0
    for c in carpetes:
        m, errors, avisos = valida(c)
        estat = "OK"
        pdf = None
        if not errors and not a.sense_compilar:
            pdf, prob = compila(c, m, a.png)
            if pdf is None:
                errors += prob
            else:
                avisos += prob
        if errors:
            estat = "ERROR"
            n_err += 1
        print(f"[{estat}] {c.name}")
        for e in errors:
            print(f"    ✗ {e}")
        for w in avisos:
            print(f"    ! {w}")
        if pdf:
            print(f"    → {pdf}")
    print(f"\n{len(carpetes)} exercicis, {n_err} amb errors")
    sys.exit(1 if n_err else 0)


if __name__ == "__main__":
    main()
