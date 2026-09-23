#!/usr/bin/env python3
"""Aplica a la base de dades les revisions exportades des de la web.

  aplica_revisions.py revisions.json            aplica els canvis a metadades.yaml
  aplica_revisions.py revisions.json --prova    només mostra què canviaria

Camps que es poden revisar: revisat, dificultat, bloc, subtemes, tipus,
paraules_clau. El comentari de revisió s'afegeix al camp `notes`.
Només es reescriuen les línies d'aquests camps; la resta del fitxer es conserva.
Després cal regenerar la web: python3 eines/construeix_web.py
"""
import argparse
import json
import subprocess
import sys
from datetime import date
from pathlib import Path

import yaml

ARREL = Path(__file__).resolve().parent.parent
EXERCICIS = ARREL / "base_dades" / "exercicis"
CAMPS = ["revisat", "dificultat", "bloc", "subtemes", "tipus", "paraules_clau"]


def bloc_yaml(clau, valor):
    """Línies YAML per a `clau: valor` (llistes en format de bloc)."""
    if isinstance(valor, list):
        if not valor:
            return f"{clau}: []\n"
        items = yaml.safe_dump(valor, allow_unicode=True, default_flow_style=False, width=1000)
        return f"{clau}:\n" + "".join("  " + l + "\n" for l in items.splitlines())
    if isinstance(valor, str) and "\n" in valor:
        # bloc literal: es llegeix igual que s'escriu
        return f"{clau}: |-\n" + "".join(("  " + l).rstrip() + "\n" for l in valor.splitlines())
    return yaml.safe_dump({clau: valor}, allow_unicode=True, width=88, sort_keys=False)


def substitueix(text, clau, nou):
    """Substitueix el camp de primer nivell `clau` (amb les seves línies de continuació)."""
    linies = text.splitlines(keepends=True)
    for i, l in enumerate(linies):
        if l.startswith(f"{clau}:"):
            j = i + 1
            while j < len(linies) and (linies[j].startswith((" ", "-")) or not linies[j].strip()):
                j += 1
            # conserva les línies en blanc finals
            while j > i + 1 and not linies[j - 1].strip():
                j -= 1
            return "".join(linies[:i]) + nou + "".join(linies[j:])
    return text.rstrip("\n") + "\n" + nou


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("fitxer")
    ap.add_argument("--prova", action="store_true", help="no escriu res, només mostra els canvis")
    a = ap.parse_args()
    sys.stdout.reconfigure(line_buffering=True)

    dades = json.loads(Path(a.fitxer).read_text(encoding="utf-8"))
    if dades.get("format") != "pau-fisica-revisions":
        sys.exit("El fitxer no és una exportació de revisions de la web.")

    tocats = []
    for id_, rev in sorted(dades.get("revisions", {}).items()):
        f = EXERCICIS / id_ / "metadades.yaml"
        if not f.exists():
            print(f"! {id_}: no existeix a la base de dades (s'ignora)")
            continue
        text = f.read_text(encoding="utf-8")
        m = yaml.safe_load(text)
        canvis = []
        for camp in CAMPS:
            if camp in rev and rev[camp] != m.get(camp):
                canvis.append(f"{camp}: {m.get(camp)!r} -> {rev[camp]!r}")
                text = substitueix(text, camp, bloc_yaml(camp, rev[camp]))
        comentari = (rev.get("comentari") or "").strip()
        if comentari and comentari not in (m.get("notes") or ""):
            nota = f"Revisió ({date.today().isoformat()}): {comentari}"
            notes = f"{m['notes']}\n{nota}" if m.get("notes") else nota
            canvis.append(f"notes += {nota!r}")
            text = substitueix(text, "notes", bloc_yaml("notes", notes))
            rev = {**rev, "notes": notes}
        if not canvis:
            continue
        # comprovació: el YAML resultant ha de tenir els valors esperats
        nou = yaml.safe_load(text)
        for camp in CAMPS + ["notes"]:
            if camp in rev and nou.get(camp) != rev[camp]:
                sys.exit(f"Error intern en {id_}.{camp}: no s'ha escrit bé. No s'ha modificat res d'aquest exercici.")
        print(f"{id_}:")
        for c in canvis:
            print(f"    {c}")
        if not a.prova:
            f.write_text(text, encoding="utf-8")
            tocats.append(str(f.parent))

    if a.prova:
        print("\n(mode de prova: no s'ha escrit res)")
        return
    if not tocats:
        print("Cap canvi a aplicar.")
        return
    print(f"\n{len(tocats)} exercicis actualitzats. Validant…")
    r = subprocess.run([sys.executable, str(ARREL / "eines" / "comprova.py"), "--sense-compilar", *tocats])
    if r.returncode == 0:
        subprocess.run([sys.executable, str(ARREL / "eines" / "index.py")])
        print("Ara regenera la web: python3 eines/construeix_web.py")


if __name__ == "__main__":
    main()
