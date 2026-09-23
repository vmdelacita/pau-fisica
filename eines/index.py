#!/usr/bin/env python3
"""Genera l'índex de la base de dades a partir de les metadades.

  index.py            escriu base_dades/index.json i base_dades/index.csv
  index.py --resum    a més, mostra un resum per bloc, any i dificultat

L'índex és derivat: no s'ha d'editar a mà (es regenera sempre).
"""
import argparse
import collections
import csv
import json
from pathlib import Path

import yaml

ARREL = Path(__file__).resolve().parent.parent
BD = ARREL / "base_dades"


def carrega():
    exs = []
    for meta in sorted((BD / "exercicis").glob("*/metadades.yaml")):
        m = yaml.safe_load(meta.read_text(encoding="utf-8"))
        m["carpeta"] = str(meta.parent.relative_to(ARREL))
        exs.append(m)
    convs = []
    for info in sorted((BD / "convocatories").glob("*/info.yaml")):
        c = yaml.safe_load(info.read_text(encoding="utf-8"))
        convs.append(c)
    return exs, convs


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--resum", action="store_true")
    a = ap.parse_args()

    exs, convs = carrega()
    (BD / "index.json").write_text(
        json.dumps({"exercicis": exs, "convocatories": convs}, ensure_ascii=False, indent=1),
        encoding="utf-8")

    camps = ["id", "titol", "any", "convocatoria", "serie", "exercici", "opcio", "format",
             "curriculum", "bloc", "subtemes", "tipus", "dificultat", "punts_total", "n_apartats",
             "n_figures", "paraules_clau", "revisat"]
    with open(BD / "index.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(camps)
        for m in exs:
            ft = m["font"]
            w.writerow([m["id"], m["titol"], ft["any"], ft["convocatoria"], ft["serie"],
                        ft["exercici"], ft["opcio"] or "", m["format"], m["curriculum"], m["bloc"],
                        "; ".join(m["subtemes"]), "; ".join(m["tipus"]), m["dificultat"],
                        m["punts_total"], len(m["apartats"]), len(m["figures"] or []),
                        "; ".join(m["paraules_clau"]), m["revisat"]])

    # Comprovació creuada convocatòries <-> exercicis
    ids = {m["id"] for m in exs}
    for c in convs:
        for e in c.get("exercicis", []):
            if e not in ids:
                print(f"! {c['id']}: l'exercici {e} no existeix")

    print(f"{len(exs)} exercicis, {len(convs)} convocatòries -> base_dades/index.json, index.csv")
    if a.resum:
        for clau, fn in [("Bloc", lambda m: m["bloc"]),
                         ("Any", lambda m: m["font"]["any"]),
                         ("Dificultat", lambda m: m["dificultat"]),
                         ("Currículum", lambda m: m["curriculum"]),
                         ("Font", lambda m: m["font"]["tipus"])]:
            print(f"\n{clau}:")
            for k, n in sorted(collections.Counter(map(fn, exs)).items(), key=lambda x: str(x[0])):
                print(f"  {k}: {n}")


if __name__ == "__main__":
    main()
