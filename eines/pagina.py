#!/usr/bin/env python3
"""Utilitats per llegir pàgines dels PDF de la PAU i retallar-ne figures.

Pàgines numerades des d'1 (com al visor de PDF). Coordenades en punts PDF
(1/72 polzada), origen a dalt a l'esquerra.

  pagina.py render PDF PAG SORTIDA.png [--dpi 110] [--graella]
      Renderitza la pàgina. Amb --graella hi dibuixa una graella cada 50 pt
      amb etiquetes, per poder triar coordenades de retall a ull.
  pagina.py text PDF PAG
      Text de la pàgina per blocs, amb la seva caixa [x0 y0 x1 y1].
  pagina.py figures PDF PAG
      Proposa caixes candidates a figura (agrupant traços vectorials i
      imatges). Són només suggeriments: cal comprovar-les visualment.
  pagina.py retalla PDF PAG x0 y0 x1 y1 SORTIDA.png [--dpi 300]
      Retalla la regió indicada a PNG (per defecte 300 dpi).
"""
import argparse
import sys

import fitz  # PyMuPDF


def obre(pdf, pag):
    doc = fitz.open(pdf)
    if not 1 <= pag <= doc.page_count:
        sys.exit(f"Pàgina {pag} fora de rang (1..{doc.page_count})")
    return doc, doc[pag - 1]


def render(a):
    doc, p = obre(a.pdf, a.pag)
    pix = p.get_pixmap(dpi=a.dpi)
    if a.graella:
        # Dibuixa la graella en una còpia de la pàgina per no tocar l'original
        tmp = fitz.open()
        tmp.insert_pdf(doc, from_page=a.pag - 1, to_page=a.pag - 1)
        q = tmp[0]
        w, h = q.rect.width, q.rect.height
        for x in range(0, int(w) + 1, 50):
            q.draw_line((x, 0), (x, h), color=(1, 0, 0), width=0.3 if x % 100 else 0.7)
            q.insert_text((x + 1, 8), str(x), fontsize=6, color=(1, 0, 0))
        for y in range(0, int(h) + 1, 50):
            q.draw_line((0, y), (w, y), color=(0, 0, 1), width=0.3 if y % 100 else 0.7)
            q.insert_text((1, y - 1), str(y), fontsize=6, color=(0, 0, 1))
        pix = q.get_pixmap(dpi=a.dpi)
    pix.save(a.sortida)
    print(f"{a.sortida} ({pix.width}x{pix.height}px, pàgina {p.rect.width:.0f}x{p.rect.height:.0f}pt)")


def text(a):
    _, p = obre(a.pdf, a.pag)
    for b in p.get_text("blocks"):
        x0, y0, x1, y1, t = b[:5]
        print(f"[{x0:6.1f} {y0:6.1f} {x1:6.1f} {y1:6.1f}] {t.strip()}")


def _fusiona(caixes, marge):
    caixes = [fitz.Rect(c) for c in caixes]
    canviat = True
    while canviat:
        canviat = False
        res = []
        while caixes:
            c = caixes.pop()
            gran = c + (-marge, -marge, marge, marge)
            i = 0
            while i < len(caixes):
                if gran.intersects(caixes[i]):
                    c |= caixes.pop(i)
                    gran = c + (-marge, -marge, marge, marge)
                    canviat = True
                else:
                    i += 1
            res.append(c)
        caixes = res
    return caixes


def figures(a):
    _, p = obre(a.pdf, a.pag)
    W, H = p.rect.width, p.rect.height
    caixes = []
    for d in p.get_drawings():
        r = d["rect"]
        # descarta línies de pàgina sencera i marcs de pàgina
        if r.width > 0.9 * W or r.height > 0.9 * H:
            continue
        caixes.append(r)
    for img in p.get_image_info():
        caixes.append(fitz.Rect(img["bbox"]))
    grups = [c for c in _fusiona(caixes, a.marge) if c.width >= 15 and c.height >= 15]
    # Afegeix etiquetes de text curtes properes a cada grup (p. ex. "Càtode"),
    # però no les línies de paràgraf (massa amples).
    linies = [fitz.Rect(l["bbox"]) for b in p.get_text("dict")["blocks"]
              for l in b.get("lines", [])]
    for i, g in enumerate(grups):
        gran = g + (-10, -10, 10, 10)  # fixa: no s'encadena
        nou = fitz.Rect(g)
        for l in linies:
            if l.width < 120 and gran.intersects(l):
                nou |= l
        grups[i] = nou
    for c in sorted(grups, key=lambda r: (r.y0, r.x0)):
        print(f"{c.x0:6.1f} {c.y0:6.1f} {c.x1:6.1f} {c.y1:6.1f}   ({c.width:.0f}x{c.height:.0f}pt)")


def retalla(a):
    _, p = obre(a.pdf, a.pag)
    clip = fitz.Rect(a.x0, a.y0, a.x1, a.y1) & p.rect
    pix = p.get_pixmap(dpi=a.dpi, clip=clip, alpha=False)
    pix.save(a.sortida)
    print(f"{a.sortida} ({pix.width}x{pix.height}px)")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="ordre", required=True)

    r = sub.add_parser("render")
    r.add_argument("pdf"); r.add_argument("pag", type=int); r.add_argument("sortida")
    r.add_argument("--dpi", type=int, default=110)
    r.add_argument("--graella", action="store_true")
    r.set_defaults(f=render)

    t = sub.add_parser("text")
    t.add_argument("pdf"); t.add_argument("pag", type=int)
    t.set_defaults(f=text)

    f = sub.add_parser("figures")
    f.add_argument("pdf"); f.add_argument("pag", type=int)
    f.add_argument("--marge", type=float, default=6)
    f.set_defaults(f=figures)

    c = sub.add_parser("retalla")
    c.add_argument("pdf"); c.add_argument("pag", type=int)
    for k in ("x0", "y0", "x1", "y1"):
        c.add_argument(k, type=float)
    c.add_argument("sortida")
    c.add_argument("--dpi", type=int, default=300)
    c.set_defaults(f=retalla)

    a = ap.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
