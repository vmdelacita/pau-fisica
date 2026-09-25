# Exercicis PAU Física

Web per cercar exercicis de les PAU de Física de Catalunya (2019–2026, examen model i documents de mostra), seleccionar-los, editar-los i compondre'n **exàmens o fulls d'exercicis en PDF** amb la plantilla del centre. El PDF es compila amb LaTeX **dins del navegador**: no cal instal·lar res ni tenir cap servidor.

**Web:** <https://vmdelacita.github.io/pau-fisica/>

## Dues versions

| | Versió pública (per compartir) | Versió d'administració |
|---|---|---|
| Adreça | <https://vmdelacita.github.io/pau-fisica/> | <https://vmdelacita.github.io/pau-fisica/admin/> |
| Logo de la dreta de la capçalera | el que pugi cada professor (opcional; si no n'hi ha, la casella queda buida) | el de l'institut (`web/plantilla/RCC.png`) |
| Capçalera per defecte | en blanc | «Física 2n Batxillerat», «1r Trimestre» i les instruccions del centre |
| Pestanya Revisió | no | sí |

- Les dues comparteixen tots els fitxers. `web/admin/index.html` el genera `construeix_web.py` a partir de `web/index.html` (hi afegeix `<base href="../">` i `PAU_VERSIO = 'admin'`); no s'ha d'editar.
- Cada versió desa el seu examen en curs per separat al navegador. La primera vegada, `/admin/` recupera l'examen i les revisions que hi havia a l'adreça pública.
- `/admin/` no és secreta ni té contrasenya: qui en conegui l'adreça la pot obrir. No hi ha cap risc, perquè tot el que s'hi fa només afecta el navegador de qui la fa servir.
- **Logo pujat (versió pública):** PNG o JPG, preferiblement amb fons transparent o blanc, de quadrat a apaïsat (fins a 3:2) i d'uns 600 px d'amplada. La casella fa uns 2,3 × 2 cm. La web el redueix a 800 px com a màxim i el desa al navegador i dins del projecte `.json`. També va dins de la carpeta .zip i del projecte d'Overleaf.

## Què fa la web

- **Cerca**: per paraules (sense tenir en compte accents), bloc, subtema, dificultat, tipus de tasca, any, procedència, format, currículum i estat de revisió. Per a cada exercici es pot veure l'enunciat, la solució (pauta oficial) i els PDF originals. Els exercicis que un professor ha revisat porten l'etiqueta **«Revisat per un humà»**, i els que tracten temes que ja no són al currículum actual, **«Fora del currículum»** o **«Parcialment fora del currículum»**. Per defecte es mostren tots.
- **Examen**: s'hi afegeixen exercicis i es poden reordenar, triar-ne els apartats, canviar els punts (o reescalar el total a 10) i editar-ne el LaTeX, tant de l'enunciat com de la solució. Les edicions només afecten l'examen. També s'hi poden escriure exercicis propis, amb la seva solució. Els resultats possibles són:
  - el **PDF**;
  - les **Solucions**: un PDF a part amb la pauta de correcció de cada exercici (vegeu més avall);
  - una **carpeta .zip** amb el `.tex`, les imatges i el PDF, per retocar-la amb qualsevol LaTeX;
  - un projecte nou a **Overleaf**.

  Els exàmens es poden desar i tornar a obrir en format `.json`.

  **Solucions.** El botó *Solucions*, al costat de *Genera el PDF*, compon la pauta de correcció de l'examen:
  - Porta el títol «Solucions» i, a sota, el departament, el trimestre i la unitat de l'examen. Es desa com a `<nom>-solucions.pdf`.
  - Els apartats exclosos de l'examen s'ometen. Si s'han canviat els punts d'un apartat, les puntuacions parcials de la pauta (`\punts{…}`) es reescalen en la mateixa proporció.
  - Als fulls d'exercicis no es mostra cap puntuació.
  - Amb la casella *Inclou l'enunciat de cada exercici a les solucions*, cada solució va precedida del seu enunciat.
  - Si un exercici no té solució (un exercici propi on encara no s'ha escrit), surt l'etiqueta «sense solució». Es pot escriure a l'editor (✎), a la pestanya **Solució**.
  - Quan s'han generat tots dos documents, un selector *Examen / Solucions* canvia el que es veu. Les descàrregues (PDF, .zip, Overleaf, .tex) són sempre del document que es veu.
- **Revisió** (només a la versió d'administració): vegeu la secció següent.

## Revisió de la base de dades

La pestanya **Revisió** només es veu a la versió d'administració:

<https://vmdelacita.github.io/pau-fisica/admin/>

(Abans s'hi entrava amb `?revisio`; ara aquest paràmetre ja no fa res.) No hi ha cap risc: la pestanya només modifica el navegador de qui la fa servir, i la base de dades només canvia quan s'aplica `revisions.json` i es publica.

A la versió d'administració:
- A la fitxa de cada exercici hi ha la pestanya **Revisió**, per marcar-lo com a revisat i corregir-ne la dificultat, el currículum, el bloc, els subtemes, el tipus i les paraules clau. També s'hi poden afegir comentaris.
- Els canvis es desen al navegador i es veuen de seguida a la cerca. Les revisions que encara no s'han aplicat surten com a **pendents** (p. ex. «Revisat per un humà (pendent)», amb vora discontínua).
- Per fer-les permanents: **Exporta les revisions** → `python3 eines/aplica_revisions.py revisions.json` → `git push`.

Els visitants només veuen el que hi ha a la base de dades publicada: l'etiqueta «Revisat per un humà» dels exercicis amb `revisat: true` i el filtre de revisió («Sense revisar», «Revisats per un humà», «Amb dubtes»).

## Estructura

```
base_dades/     exercicis en LaTeX + metadades (vegeu base_dades/FORMAT.md)
eines/          scripts de manteniment (Python 3 + PyYAML)
  construeix_web.py    base_dades/ -> web/dades/
  aplica_revisions.py  revisions.json -> base_dades/
  serveix_web.py       servidor local per provar la web
  comprova.py, index.py, pagina.py   validació i extracció (fase 2)
  motor_tex/           com s'ha construït el motor LaTeX reduït
web/            la web estàtica (és el que es publica)
  admin/index.html     GENERAT: versió d'administració
  plantilla/examen.tex plantilla del centre (editable; el logo de la dreta és \logocentre)
  plantilla/solucions.tex plantilla del solucionari (editable)
  motor/               LaTeX en WebAssembly (BusyTeX)
  dades/               GENERAT per construeix_web.py
examenes/, documents oficials/   PDF originals
```

## Ús en local

```bash
python3 eines/construeix_web.py     # genera web/dades/
python3 eines/serveix_web.py        # obre http://localhost:8000
```

La web no funciona si s'obre `index.html` directament: cal un servidor.

## Actualitzar la base de dades

1. Modifica els exercicis de `base_dades/` o aplica les revisions exportades:
   `python3 eines/aplica_revisions.py revisions.json`
2. Valida: `python3 eines/comprova.py --tot`
3. Regenera les dades de la web: `python3 eines/construeix_web.py`

## Publicar la web

La web és una carpeta de fitxers estàtics (`web/`) i es pot allotjar en qualsevol servei gratuït de pàgines estàtiques. Google Sites no pot allotjar-la directament, però sí incrustar-la.

**Opció recomanada: GitHub Pages**
1. Crea un repositori a GitHub i puja-hi aquesta carpeta. GitHub Pages gratuït requereix que el repositori sigui públic.
2. A *Settings → Pages → Source*, tria **GitHub Actions**. El workflow `.github/workflows/publica-web.yml` regenera les dades i publica `web/` cada vegada que puges canvis.
3. La web queda a `https://<usuari>.github.io/<repositori>/`.

**Incrustar-la a Google Sites**: *Insereix → Insereix → Per URL*, enganxa-hi l'adreça i tria «Pàgina sencera». Dins d'un Google Site la web té menys espai i el navegador pot limitar les descàrregues. Per això la web mostra un enllaç «Obre en una pestanya nova ↗» quan està incrustada. També és recomanable posar-hi un botó que enllaci directament a l'adreça de la web.

## Llicències i crèdits

- Web: **Víctor Moreno**, amb llicència [Creative Commons Reconeixement-NoComercial 4.0 (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/deed.ca). Es pot fer servir, copiar i adaptar lliurement sense finalitat lucrativa, citant-ne l'autor. Vegeu `LICENSE.md`.
- Enunciats i pautes: PAU de Física, Generalitat de Catalunya (Departament de Recerca i Universitats).
- Motor LaTeX: [BusyTeX / texlyre-busytex](https://github.com/TeXlyre/texlyre-busytex) (AGPL-3.0) amb TeX Live 2026.
- Fórmules a la web: [MathJax](https://www.mathjax.org/). ZIP: [JSZip](https://stuk.github.io/jszip/).
