#!/usr/bin/env python3
"""Genera les dades de la web (web/dades/) a partir de la base de dades.

  construeix_web.py              regenera web/dades/, web/admin/index.html i
                                 web/plantilla/preambul_exercicis.tex

Cal executar-lo cada vegada que es modifica la base de dades (exercicis,
metadades, taxonomia o preàmbul). La resta de la web (web/js, web/plantilla,
web/motor) no es toca.
"""
import json
import re
import shutil
from datetime import datetime
from pathlib import Path

import yaml

ARREL = Path(__file__).resolve().parent.parent
BD = ARREL / "base_dades"
EINES = ARREL / "eines"
WEB = ARREL / "web"
DADES = WEB / "dades"

RE_DUBTE = re.compile(r"%\s*DUBTE:\s*(.*)")


def dubtes(*textos):
    return [m.group(1).strip() for t in textos for m in RE_DUBTE.finditer(t)]


def construeix_admin():
    """Versió d'administració (web/admin/): la mateixa pàgina amb <base href="../"> perquè
    comparteixi tots els fitxers, i PAU_VERSIO='admin' (logo de l'institut, valors per
    defecte del centre i mode revisió)."""
    html = (WEB / "index.html").read_text(encoding="utf-8")
    marca = '<meta charset="utf-8">'
    assert marca in html, "index.html ha de tenir <meta charset=\"utf-8\">"
    html = html.replace(marca, marca + '\n<base href="../">\n'
                        "<script>window.PAU_VERSIO = 'admin';</script>", 1)
    html = html.replace("<title>Exercicis PAU Física</title>",
                        "<title>Exercicis PAU Física (admin)</title>", 1)
    (WEB / "admin").mkdir(exist_ok=True)
    html = html.replace(marca, "<!-- GENERAT per eines/construeix_web.py a partir de web/index.html: "
                        "no l'editis. -->\n" + marca, 1)
    (WEB / "admin" / "index.html").write_text(html, encoding="utf-8")


def main():
    taxonomia = yaml.safe_load((EINES / "taxonomia.yaml").read_text(encoding="utf-8"))

    if DADES.exists():
        shutil.rmtree(DADES)
    (DADES / "fig").mkdir(parents=True)
    (DADES / "originals").mkdir()

    pdfs = set()
    exercicis = []
    for carpeta in sorted(p for p in (BD / "exercicis").iterdir() if p.is_dir()):
        m = yaml.safe_load((carpeta / "metadades.yaml").read_text(encoding="utf-8"))
        enunciat = (carpeta / "enunciat.tex").read_text(encoding="utf-8")
        solucio = (carpeta / "solucio.tex").read_text(encoding="utf-8")
        pngs = sorted(p.name for p in carpeta.glob("*.png"))
        if pngs:
            dest = DADES / "fig" / m["id"]
            dest.mkdir()
            for nom in pngs:
                shutil.copy2(carpeta / nom, dest / nom)
        font = m["font"]
        for clau in ("pdf_enunciat", "pdf_solucio"):
            if font.get(clau):
                pdfs.add(font[clau])
        m["enunciat"] = enunciat
        m["solucio"] = solucio
        m["fitxers_figures"] = pngs
        m["dubtes"] = dubtes(enunciat, solucio)
        m["conv"] = "_".join(m["id"].split("_")[:3])
        exercicis.append(m)

    convocatories = {}
    for info in sorted((BD / "convocatories").glob("*/info.yaml")):
        c = yaml.safe_load(info.read_text(encoding="utf-8"))
        crit = info.parent / "criteris_generals.tex"
        c["criteris_generals"] = crit.read_text(encoding="utf-8") if crit.exists() else ""
        convocatories[c["id"]] = c

    # PDF originals (per comparar durant la revisió)
    for rel in sorted(pdfs):
        orig = ARREL / rel
        if orig.exists():
            shutil.copy2(orig, DADES / "originals" / orig.name)

    base = {
        "generat": datetime.now().isoformat(timespec="seconds"),
        "taxonomia": taxonomia,
        "convocatories": convocatories,
        "exercicis": exercicis,
    }
    (DADES / "base.json").write_text(json.dumps(base, ensure_ascii=False, separators=(",", ":")),
                                     encoding="utf-8")
    shutil.copy2(EINES / "preambul_exercicis.tex", WEB / "plantilla" / "preambul_exercicis.tex")
    construeix_admin()

    n_fig = sum(len(e["fitxers_figures"]) for e in exercicis)
    print(f"{len(exercicis)} exercicis, {len(convocatories)} convocatòries, {n_fig} figures, "
          f"{len(pdfs)} PDF originals -> {DADES.relative_to(ARREL)}/")


if __name__ == "__main__":
    main()
