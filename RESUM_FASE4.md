# Fase 4 — Solucions des de la web: resum

**Data:** 2026-09-25 · **Estat:** acabada (pendent de publicar amb `git push`)
Resums anteriors: `RESUM_FASE3.md` (web), `PLA_EXAMENS_ANTICS.md` i `RESUM_LOT2B.md` (exàmens antics).

## Decisions del professor (abans de la fase)

1. **Exàmens antics:** no se n'afegeixen més de moment. Els lots 3 (2009–2012) i 4 (2000–2008) queden aparcats. Els PDF es queden a `examenes antiguos/`.
2. **Botó «Solucions»** al costat del botó de l'examen, que genera la pauta de correcció.
3. **Capçalera:** un **títol simple, sense taula ni logos**: «Solucions» i, a sota, departament · trimestre i la unitat.
4. **Criteris generals de la PAU:** **no** s'hi inclouen. N'hi ha 25 versions diferents, gairebé iguals, i els del centre ja són a les instruccions de l'examen.
5. **Edició de solucions:** es pot editar la solució de **tots** els exercicis, no només dels propis. Els canvis només afecten l'examen.
6. **Enunciats al solucionari:** amb una **casella**, desmarcada per defecte.

Es mantenen les decisions anteriors (`PLA_EXAMENS_ANTICS.md`, secció 2): PDF a part, puntuacions parcials reescalades i apartats exclosos omesos.

## Què fa la web ara

- **Botó «Solucions»** al costat de «Genera el PDF». Genera el PDF de la pauta de correcció. Es desa com a `<nom>-solucions.pdf`.
- **Títol:** «Solucions»; a sota, «Física 2n Batxillerat · 1r Trimestre» i la unitat en cursiva. Els camps buits no surten.
- **Contingut:** «Exercici 1. (2,5 punts)», amb la mateixa numeració i els mateixos punts que l'examen, i la solució de cada apartat (a), b)…).
  - Els **apartats exclosos** de l'examen s'ometen, i els que queden es tornen a numerar igual que a l'examen.
  - **Punts reescalats:** si un apartat passa d'1,25 a 1 punt, cada `\punts{…}` de la seva pauta es multiplica per 1/1,25 (0,75 → 0,6). El factor es calcula apartat per apartat. Per això també funciona amb les pautes on les parcials no sumen exactament el valor de l'apartat (p. ex. 2015 setembre S5 P5B).
  - **Full d'exercicis:** no es mostra cap puntuació, ni la de l'exercici ni les parcials de la pauta.
  - La casella **«Indica la procedència»** també s'aplica a les solucions.
  - La casella nova **«Inclou l'enunciat de cada exercici a les solucions»** posa l'enunciat abans de cada solució, amb el títol «Solució».
- **Selector «Examen / Solucions»:** apareix quan s'han generat tots dos documents i canvia el que es veu al visor. Les descàrregues (PDF, .zip, Overleaf, «Mostra el .tex») són del document que es veu. Quan hi ha canvis, l'avís de «torna a generar» indica quin botó cal prémer.
- **Editor (✎):** té dues pestanyes, **Enunciat** i **Solució**.
  - En un exercici propi, la pestanya Solució comença amb una plantilla buida: un `solapartat` per cada apartat de l'enunciat.
  - Si la solució no té tants apartats com l'enunciat, surt un avís.
  - «Restaura la pauta original» torna a la pauta de la base de dades.
  - L'ajuda ràpida de la pestanya Solució explica `solapartat`, `\punts` i `\destaca`.
- **Etiquetes a la llista d'exercicis:**
  - «enunciat editat» i «solució editada»;
  - **«sense solució»** (exercici propi sense solució; en fer-hi clic s'obre l'editor a la pestanya Solució);
  - «sense solució oficial» (els 4 exemples d'experiments de 2025).

  Si en generar les solucions algun exercici no en té, la web ho avisa. Al PDF surt «No s'ha escrit la solució d'aquest exercici.».
- Les solucions editades es desen al navegador i als projectes `.json`. Els projectes antics s'obren igual.

## Fitxers nous o modificats

```
web/plantilla/solucions.tex   NOU: plantilla del solucionari (títol simple, sense logos)
web/js/examen.js              generaTex(..., solucions): composició del solucionari,
                              reescalat de \punts i apartats exclosos
web/js/app.js                 botó Solucions, selector de document, editor amb pestanyes, etiquetes
web/index.html, web/estil.css
eines/preambul_exercicis.tex  \punts no es mostra amb \mostrapuntsfalse (fulls d'exercicis)
                              (i la còpia a web/plantilla/)
README.md, PLA_EXAMENS_ANTICS.md
```

## Proves fetes

- **Tots els exercicis:** el solucionari dels 309 exercicis, en tandes de 25, compila al navegador amb el motor de la web:
  - en mode examen, sense enunciats;
  - en mode full d'exercicis, amb enunciats.

  Són 26 documents: 0 errors i cap caixa que surti del marge.
- **Interfície, a Chrome headless:**
  - apartat exclòs;
  - punts reescalats (1,25 → 1: 0,75 → 0,6, 0,5 → 0,4);
  - exercici propi amb la solució escrita a l'editor;
  - avís quan el nombre d'apartats no quadra;
  - selector de document i avís de document desactualitzat;
  - casella d'enunciats i full d'exercicis;
  - exercici sense solució oficial i exercici propi sense solució;
  - «Restaura la pauta original».

  Cap error a la consola.
- `comprova.py` continua donant `[OK]` amb el preàmbul modificat.
- He revisat visualment els PDF generats (examen i full d'exercicis).

## Limitacions

- Les pautes tenen alguna puntuació dins d'una fórmula (p. ex. 2016 juny S3 P1: `\text{\punts{0,3}}`). També es reescalen, perquè el reescalat treballa sobre el text.
- Els **descomptes** escrits amb `\punts` (p. ex. «descomptarem 0,1», 2015 juny S4 P2) també es reescalen proporcionalment.
- Els exercicis propis continuen sense poder tenir imatges pròpies. Amb la carpeta .zip o Overleaf sí que es poden afegir.

## Dubtes per a la Fase 5 (versió per compartir amb altres centres)

La idea és una segona adreça de la web on no surti el logo de l'institut i on cada professor pugui pujar el seu logo. El solucionari no porta logos, així que només afecta l'examen.

1. **Com es separen les dues versions?** Proposta: la web és la mateixa i només canvia la configuració.
   - La versió per compartir seria l'adreça principal (`…/pau-fisica/`), sense el logo de l'institut i amb el camp per pujar-ne un.
   - La teva versió seria una adreça pròpia (p. ex. `…/pau-fisica/?centre=…`, que el navegador recorda, com el mode revisió), amb el logo de l'institut i els valors per defecte actuals.

   L'alternativa és al revés: deixar la teva a l'adreça actual i fer-ne una de nova per compartir (`…/pau-fisica/compartir/`). Què prefereixes?
2. **Logo de la Generalitat** i el text «Generalitat de Catalunya · Departament d'Educació i Formació Professional»: s'hi mantenen a la versió per compartir? Si hi ha centres concertats o privats, potser haurien de ser opcionals (una casella).
3. **On es desa el logo pujat:** proposta, al navegador (com l'examen en curs) i dins del projecte `.json`, perquè es mantingui en obrir un projecte desat. També aniria dins de la carpeta .zip i del projecte d'Overleaf.
4. **Mides recomanades** que indicaria la web: la casella del logo fa uns 2,3 cm d'ample i uns 2 cm d'alt. Proposta de text: «PNG o JPG, preferiblement amb fons transparent o blanc, entre quadrat i apaïsat (fins a 3:2), d'uns 600 px d'ample». Si no se'n puja cap, la casella queda buida. Et sembla bé, o preferiu que la columna del logo desaparegui?
5. **Valors per defecte** de la versió per compartir: «Física 2n Batxillerat», «1r Trimestre» i les tres instruccions actuals (20 % per errors d'unitats, calculadora…). Es mantenen o es deixen més neutres o en blanc?
6. **Crèdits:** vols que la versió per compartir digui qui l'ha feta (nom, centre o contacte) al peu de la pàgina?
