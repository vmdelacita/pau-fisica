# Motor LaTeX de la web

La web compila els PDF al navegador amb [BusyTeX](https://github.com/TeXlyre/texlyre-busytex), que és pdfLaTeX de TeX Live 2026 compilat a WebAssembly. La versió fa servir la llicència AGPL-3.0: vegeu `web/motor/LICENSE-busytex.txt`.

## Fitxers a `web/motor/`

| Fitxer | Mida | Origen |
|---|---|---|
| `busytex.wasm`, `busytex.js`, `busytex_pipeline.js`, `busytex_worker.js`, `busytex_biber.js` | 32 MB | Recursos de BusyTeX v1.4.0 (`busytex-assets.tar.gz` de la [release `assets-v1.4.0`](https://github.com/TeXlyre/texlyre-busytex/releases)), sense modificar |
| `busytex-runner.js` | 22 KB | `dist/index.js` del paquet npm `texlyre-busytex@1.4.0` |
| `texlive-pau.data` + `texlive-pau.js` | 16 MB | **Paquet TeX reduït**, generat amb `empaqueta_texmf.py` a partir de `texmf/` |

BusyTeX ofereix paquets TeX de 90 a 330 MB. Aquí se n'ha fet un de reduït que només conté:

- els fitxers que s'obren realment en compilar **tots els exercicis de la base de dades** (enunciats i solucions) amb la plantilla. Es van registrar interceptant `FS.open` en una compilació feta al navegador;
- per marge, alguns paquets sencers (`tools`, `amsmath`, `siunitx`, `cancel`, `wrapfig`, `float`, `titlesec`, `booktabs`, `enumitem`…) i les famílies de fonts Latin Modern i AMS;
- `catalan.ldf` (de `babel-catalan`, TeX Live 2026), que no hi ha a cap paquet de BusyTeX;
- `pdftex.map`, retallat a les fonts incloses (de 5,5 MB a 12 KB).

## Afegir un paquet LaTeX

Si un exercici editat necessita un paquet que no hi és, la web mostra l'error «File `x.sty' not found». Mentrestant, el document es pot obrir a Overleaf. Per afegir el paquet:

1. Descarrega el paquet de TeX Live:
   `curl -LO https://mirror.ctan.org/systems/texlive/tlnet/archive/NOM.tar.xz`
2. Descomprimeix-lo i copia'n la carpeta `tex/latex/NOM/` a `texmf/texlive/texmf-dist/tex/latex/NOM/`.
3. Executa `python3 eines/motor_tex/empaqueta_texmf.py`, que regenera `ls-R` i `web/motor/texlive-pau.*`.

Si el paquet necessita fonts noves, també cal copiar-ne els `.tfm`/`.pfb` i afegir les línies corresponents a `texmf-var/fonts/map/pdftex/updmap/pdftex.map`.
