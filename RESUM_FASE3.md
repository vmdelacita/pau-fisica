# Fase 3 — Aplicació web: resum

**Data:** 2026-09-23 · **Estat:** acabada (pendent de publicar)
Pla general del projecte: `RESUM_FASE1.md`. Base de dades: `RESUM_FASE2.md`.

## Decisions del professor (abans de la fase)

1. **Tipus d'aplicació:** una **pàgina web**, que s'incrustarà a Google Sites. Substitueix la idea inicial d'una app instal·lable des de GitHub.
2. **GitHub:** encara no està decidit. Vegeu *Publicació* més avall.
3. **Edició d'exercicis:** els canvis **només** s'apliquen a l'examen o full d'exercicis, no a la base de dades.
4. **Format:**
   - apartats **a), b)**;
   - es mostren els **punts de cada apartat**;
   - **no** es deixa espai per respondre;
   - els **fulls d'exercicis** tenen el mateix format, però **sense puntuacions**.
5. **Sortida:** el **PDF** i una **carpeta** amb el `.tex` i les imatges per poder-lo editar.
6. **Idioma de la web:** català.
7. **Revisió:** sí, des de la web.

## Solució tècnica

Una web estàtica pot allotjar-se gratis i incrustar-se a Google Sites, però **no pot executar Tectonic**. Es van provar diverses opcions per compilar el LaTeX:

| Opció | Resultat |
|---|---|
| texlive.net (servidor de LaTeX) | ✗ Límit d'1 MB i corromp els fitxers binaris (imatges) |
| SwiftLaTeX (WASM) | ✗ El servidor de paquets ja no funciona |
| **BusyTeX** (pdfLaTeX de TeX Live 2026 en WebAssembly) | ✓ Compila la plantilla i els 79 exercicis sense errors |
| Overleaf («Open in Overleaf» amb un ZIP) | ✓ Com a opció complementària, per editar |

BusyTeX es distribueix amb paquets TeX de 90 a 330 MB. Se n'ha fet un de **reduït de 16 MB** amb el mètode següent:

1. Es compilen els 79 exercicis al navegador i es registren tots els fitxers que s'obren.
2. S'hi afegeix un marge de paquets habituals.
3. S'hi afegeix `catalan.ldf`, que BusyTeX no inclou.

La primera vegada es descarreguen uns **49 MB**, que després queden a la memòria cau. Un examen es compila en **~1 s** (mesurat a Chrome en aquest Mac). Detalls i instruccions per afegir paquets: `eines/motor_tex/README.md`.

## Què fa la web

- **Cerca**:
  - Per paraules, sense tenir en compte accents ni la «l·l». Els resultats s'ordenen per rellevància i es ressalten els termes trobats.
  - Filtres: bloc, subtema, dificultat, tipus de tasca, any, procedència, format i estat de revisió.
  - La fitxa de cada exercici té les pestanyes **Enunciat** i **Solució** (amb MathJax), i **Revisió**. També enllaça els **PDF originals** a la pàgina corresponent. Es pot passar d'un exercici a un altre amb ← →.
- **Examen**:
  - Capçalera de la plantilla del centre: departament, trimestre, unitat i instruccions.
  - Tipus de document: *Examen* o *Full d'exercicis*.
  - Opció per indicar la procedència de cada exercici.
  - Exercicis: es poden reordenar, triar-ne els apartats, canviar els punts, **reescalar a N punts** i editar-ne el LaTeX amb previsualització en directe. També s'hi poden afegir **exercicis propis**.
  - Sortida:
    - el PDF, que es veu dins de la mateixa web;
    - una **carpeta .zip** (`.tex` autònom + `figures/` + logos + PDF);
    - **Obre a Overleaf**;
    - «Mostra el .tex».
  - Si la compilació falla, la web mostra l'error amb l'exercici i la línia on s'ha produït, i una explicació en català. Tot i així, es pot descarregar el `.tex` o obrir-lo a Overleaf.
  - L'examen es desa sol al navegador. També es pot **desar i obrir en format `.json`**.
- **Revisió**:
  - Per marcar exercicis com a revisats i corregir-ne la dificultat (amb la rúbrica), el bloc, els subtemes, el tipus i les paraules clau. També s'hi poden afegir comentaris.
  - Els canvis es veuen de seguida a la cerca i es desen al navegador.
  - **Exporta → `revisions.json`** → `python3 eines/aplica_revisions.py revisions.json`. Aquest script:
    - només reescriu els camps afectats de `metadades.yaml`;
    - afegeix el comentari a `notes`;
    - valida el resultat i regenera l'índex.

## Fitxers nous o modificats

```
web/                          ← LA WEB (és el que es publica)
├── index.html, estil.css
├── js/app.js                 interfície: cerca, examen, revisió
├── js/latex_html.js          conversor LaTeX → HTML per a la previsualització
├── js/examen.js              composició del .tex (apartats, punts, figures, procedència)
├── js/motor.js               BusyTeX: càrrega, cua de compilacions, errors
├── plantilla/examen.tex      PLANTILLA DEL CENTRE (editable; vegeu més avall)
├── plantilla/senyal_bn.png, RCC.png, preambul_exercicis.tex (còpia generada)
├── motor/                    BusyTeX + texlive-pau.data/.js (paquet TeX reduït)
└── dades/                    GENERAT: base.json, fig/, originals/ (al .gitignore)
eines/construeix_web.py       base_dades/ → web/dades/
eines/aplica_revisions.py     revisions.json → metadades.yaml
eines/serveix_web.py          servidor local (http://localhost:8000)
eines/motor_tex/              arbre TeX reduït + empaquetador + README
eines/preambul_exercicis.tex  + \mostrapuntsfalse, «1 punt» en singular, punts alineats a la dreta
.github/workflows/publica-web.yml   publicació automàtica a GitHub Pages
README.md
```

### Canvis a la plantilla (respecte a `tex ejemplo/main.tex`)

- `babel` amb **català** com a idioma principal. Abans era `[catalan,spanish]`, que deixava el castellà com a idioma principal.
- `T1` + `lmodern`: permet partir paraules amb accents.
- Els ajustos de taula de la capçalera (`\arraystretch`, `\tabcolsep`) ara només afecten la capçalera i no les taules dels exercicis.
- Si les instruccions són buides, la fila d'instruccions no es mostra.
- «Departament d'Educació i Formació Professional», amb majúscules (nom oficial).
- Instruccions per defecte: les tres últimes de la plantilla, amb «de l'exercici» corregit. La del formulari s'ha tret perquè és específica d'aquell examen. Totes es poden editar i la web les recorda.
- Els punts dels apartats s'alineen a la dreta, com a la PAU.

## Proves fetes

- Proves automàtiques a Chrome headless (Puppeteer):
  - cerca, filtres i fitxa;
  - afegir, reordenar, excloure apartats, reescalar, editar i exercici propi;
  - generar el PDF d'examen i de full, i tornar-lo a generar;
  - ZIP, desar projecte, revisió i exportació;
  - error de LaTeX;
  - vista mòbil (390 px).

  Cap error a la consola.
- Dins d'un **iframe d'un altre origen amb sandbox**, com a Google Sites: la web carrega, compila i mostra l'enllaç «Obre en una pestanya nova».
- El `.tex` de la carpeta descarregada **compila amb Tectonic** i dona el mateix PDF (mateixes pàgines i disposició).
- Els 79 exercicis compilen al navegador (150 pàgines, 2,7 s) i amb `comprova.py --tot` (0 errors).
- `aplica_revisions.py`, provat sobre una **còpia** del projecte: camps simples, llistes, comentaris i YAML amb cometes. **La base de dades real no s'ha modificat.**
- Overleaf: el formulari arriba a la pàgina d'inici de sessió, que és el comportament esperat sense sessió iniciada. No s'ha pogut provar amb un compte.

## Limitacions conegudes

- Només s'ha provat a **Chrome**. Safari i Firefox haurien de funcionar (WebAssembly i Web Workers), però no s'han provat.
- MathJax i JSZip es carreguen des de CDN, i per tant la web necessita internet.
- Les revisions i l'examen en curs es desen **al navegador**: si canvies d'ordinador, exporta'ls abans.
- Els exercicis propis no poden tenir imatges pròpies. Amb la carpeta .zip o Overleaf sí que es poden afegir.
- En copiar text del PDF, la «l·l» surt com a «l.l». És només la capa de text; visualment és correcta.
- L'editor només modifica l'enunciat. La solució entrarà a la fase 4.

## Publicació (pendent: la decideix el professor)

Google Sites no pot allotjar la web, però sí **incrustar-la**. Cal un allotjament estàtic gratuït. Detalls al `README.md`.

1. **GitHub Pages (recomanat).**
   - Cal crear un repositori **públic** amb aquesta carpeta. El repositori inclourà:
     - els PDF de la Generalitat, que ja són públics;
     - la base de dades;
     - el logo de l'institut.
   - A *Settings → Pages*, cal activar *GitHub Actions*. El workflow regenera `web/dades/` i publica la web a cada canvi.
2. **Alternativa sense Git:** Netlify o Cloudflare Pages, arrossegant-hi la carpeta `web/` després d'executar `construeix_web.py`.

A Google Sites: *Insereix → Insereix → Per URL → Pàgina sencera*. És recomanable afegir-hi també un botó que enllaci directament a la web.

Encara no s'ha fet `git init` (vegeu la pregunta 1).

## Dubtes per a la Fase 4 (correcció automàtica)

1. **Publicació:** vols fer servir GitHub Pages amb un repositori públic? Si és que sí, faig `git init` i preparo el primer commit perquè només calgui pujar-lo.
2. **Format del solucionari:**
   - Pot ser un PDF a part, el mateix document amb les solucions al final, o bé cada solució just després del seu exercici.
   - Amb la mateixa capçalera o amb una de pròpia («Solucionari»)?
3. **Punts reescalats:** si s'han canviat els punts d'un apartat, la pauta oficial té puntuacions parcials (`\punts{0,5}`) que ja no quadraran. Les puc escalar proporcionalment, o bé deixar-les com a l'original amb una nota.
4. **Apartats exclosos:** s'ometen també del solucionari (proposta: sí).
5. **Criteris generals:** incloure els de la convocatòria original, els del centre (els de les instruccions) o cap.
6. **Edició de la solució:** poder editar també la solució d'un exercici editat o propi (proposta: sí, amb el mateix editor).
