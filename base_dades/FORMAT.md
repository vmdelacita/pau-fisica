# Format de la base de dades d'exercicis

Aquest document defineix com es guarda cada exercici. El segueixen tant les persones com els agents que transcriuen els PDF.

## Estructura

```
base_dades/
├── FORMAT.md                     ← aquest document
├── exercicis/
│   └── <id>/                     ← una carpeta per exercici (cada opció A/B és un exercici)
│       ├── enunciat.tex          ← fragment LaTeX de l'enunciat
│       ├── solucio.tex           ← fragment LaTeX de la pauta oficial (tal com és)
│       ├── metadades.yaml        ← metadades per cercar i filtrar
│       ├── fig1.png, fig2.png…   ← figures de l'enunciat
│       └── sol_fig1.png…         ← figures de la solució
├── convocatories/
│   └── <conv>/                   ← una carpeta per examen original
│       ├── info.yaml             ← dades de l'examen i llista ordenada d'exercicis
│       └── criteris_generals.tex ← criteris generals de la pauta (si n'hi ha)
├── index.json, index.csv         ← GENERATS amb eines/index.py (no editar)
└── _build/                       ← previsualitzacions generades (no editar)
```

Eines (a `eines/`):
- `pagina.py`: renderitza pàgines, llegeix text i retalla figures dels PDF.
- `comprova.py`: valida i compila cada exercici (genera `_build/<id>/previsualitzacio.pdf`).
- `index.py`: genera l'índex.
- `taxonomia.yaml`: llistes tancades de blocs, subtemes i tipus, i la rúbrica de dificultat.
- `preambul_exercicis.tex`: macros LaTeX disponibles als fragments.

## Identificadors (`<id>` = nom de la carpeta)

`{any}_{convocatoria}_{serie}_{exercici}_{descriptor}`

| part | valors |
|---|---|
| any | `2019`, `2023`, `2024`… |
| convocatoria | `ord` (juny), `ext` (extraordinària o de setembre), `model` (examen de model), `mostra` (documents de mostra) |
| serie | `s1`, `s2`, `s5`… (per a les mostres: `optica`, `moment-angular`, `experiments`) |
| exercici | Format nou: `E1`…`E4` + opció (`E1A`, `E1B`; sense lletra si no hi ha opcions: `E2`). Format antic: `P1`…`P8`; si el problema forma part d'una opció (A/B), la lletra hi va enganxada: `P3A`, `P3B`. Mostres: `P1`…, `Q1`… |
| descriptor | 2–5 paraules en minúscules, sense accents, separades per guions, que identifiquin el context. Exemple: `nanosatellit-orbita-circular`, `cometa-halley-kepler`, `tub-raigs-x`. La "l·l" s'escriu `ll`. |

Exemples: `2026_ord_s1_E1A_nanosatellit-orbita-circular`, `2023_ord_s5_P3_molla-mhs-energia`, `2025_mostra_optica_P1_lupa-taula`, `2019_ord_s1_P4B_…`.

### Exàmens antics (≤2022)

| Període | Estructura | Exercicis |
|---|---|---|
| 2020–2022 | 8 problemes, se'n responen 4; cada un val 2,5 punts | `P1`…`P8`, `opcio: null` |
| ~2010–2019 | Part comuna (P1, P2) + opció A o B (P3, P4, P5); cada problema val 2 punts | `P1`, `P2`, `P3A`, `P3B`, `P4A`… (`opcio: A`/`B` a `font`) |

- Totes són `format: antic`. La convocatòria de setembre és `ext` (`convocatoria: extraordinaria`).
- Els PDF originals es copien a `examenes/` amb el nom actual: `pau_fisi19jl.pdf` (examen de juny de 2019) i `pau_fisi19jp.pdf` (pauta); `s` en lloc de `j` per a setembre. Un mateix PDF pot contenir diverses sèries: `pagines_enunciat` i `pagines_solucio` indiquen les de l'exercici.
- Les **dades comunes** (constants a la portada o al final de l'examen) es copien al `\dades{…}` de cada exercici que les necessiti.
- **PDF escanejats** (2000–2020, sense capa de text): es transcriuen visualment a partir de les pàgines renderitzades (`pagina.py render … --dpi 200`, i retalls ampliats de les zones amb fórmules petites). Les figures es retallen igual, amb `pagina.py retalla`; en un escaneig el retall ha d'anar just al voltant de la figura.
- **Pautes breus** dels primers anys: es transcriuen tal com són i s'indica a `notes` que és una pauta resumida.

L'`<conv>` de la convocatòria és el prefix: `2026_ord_s1`, `2025_model_s0`, `2025_mostra_optica`.

## `enunciat.tex`

És un **fragment**: no pot contenir `\documentclass`, `\usepackage`, `\begin{document}`, `\section`, `\input` ni `\includegraphics`. Ha de compilar amb el preàmbul `eines/preambul_exercicis.tex`.

Estructura:

```latex
Text introductori/context de l'exercici (paràgrafs normals).

\figura[0.45]{fig1.png}          % si n'hi ha; l'argument opcional és l'amplada relativa

\begin{apartat}{1,25}            % punts de l'apartat (text amb coma decimal)
Text de l'apartat…
\end{apartat}

\begin{apartat}{1,25}
…
\end{apartat}

\dades{%
  $G = 6,67\times 10^{-11}\ \mathrm{N\,m^2\,kg^{-2}}$.\\
  Massa de la Terra: $M_\mathrm{T} = 5,98\times 10^{24}\ \mathrm{kg}$.}
\nota{Negligiu els efectes relativistes.}   % si n'hi ha
```

- **No s'hi escriu el número d'apartat** (1.1, a)…): el posa qui compon l'examen. L'etiqueta original es guarda a `metadades.yaml`.
- Si un text o una figura va **entre** apartats, es posa entre els entorns `apartat` on correspongui.
- Si l'enunciat no dona punts per apartat (alguns exàmens antics), es reparteixen a parts iguals i s'indica a `notes`.
- **Dades:** hi van totes les constants necessàries per resoldre l'exercici. Si l'examen original les dona en una llista comuna (p. ex. a la portada o al final), s'hi copien les que calguin.

## `solucio.tex`

És la **pauta oficial transcrita tal com és**: el mateix text, els mateixos passos, les mateixes puntuacions parcials, les alternatives i les notes per al corrector. No es reescriu ni es corregeix. Si hi ha un error evident, es transcriu igual i es deixa un comentari `% DUBTE: …` i una nota a `notes`.

```latex
\begin{solapartat}              % un per apartat, en el mateix ordre que l'enunciat
\punts{0,75} Segons la llei de la gravitació universal…
\[ F = G\,\frac{m_s M_T}{r^2} \]
\destaca{Alternativament,} es pot calcular…
\figura[0.4]{sol_fig1.png}
\end{solapartat}
```

- `\punts{x}` reprodueix les puntuacions parcials de la pauta ("0,5 p", "0,25 p."…).
- `\destaca{…}` reprodueix el text que la pauta destaca en color ("Alternativament", "Nota"…).
- Si la pauta té una **taula** de criteris o de resultats, es transcriu amb `tabular` (sense `\hline` excessius; `booktabs` disponible).
- Si **no hi ha solució oficial** (p. ex. els exemples del document de preguntes experimentals), cada `solapartat` conté `\textit{No hi ha solució oficial.}` (o la solució curta que doni el document, p. ex. "Solució: 20 cm, 5 D") i a metadades es posa `solucio_oficial: false`.

## Convencions LaTeX (enunciat i solució)

- UTF-8 directe per als accents i la "l·l" (el preàmbul ja la compon bé).
- **Coma decimal** dins de fórmules: `$6,87\cdot 10^{6}$` (el paquet `icomma` s'encarrega de l'espaiat). No escriviu `{,}`.
- **Unitats** en rodona i separades: `$9,8\ \mathrm{m\,s^{-2}}$`, `$500\ \mathrm{km}$`. En text normal també es pot fer `500~km`.
- Multiplicacions: respecteu el signe de l'original (`\times` o `\cdot`).
- Vectors: `\vec{F}`, vectors unitaris `\vec{\imath}`, `\vec{\jmath}`, `\vec{k}`. Índexs en rodona si l'original els hi té: `M_\mathrm{T}`.
- Equacions destacades: `\[ … \]` o `align*`. Res de `$$`.
- **Taules de l'enunciat** (dades experimentals, etc.): sempre `tabular`, mai imatge.
- Les fórmules no poden sortir del marge. Parteix-les amb `align*` si cal. `comprova.py` avisa de les caixes massa amples.
- Paquets disponibles: `amsmath`, `amssymb`, `graphicx`, `xcolor`, `icomma`, `enumitem`, `array`, `booktabs`. No se n'afegeixen d'altres.
- Llistes dins de l'enunciat: `itemize`/`enumerate` normals.

### Casos especials (après durant la transcripció)

- **Coordenades i parells dins de fórmules:** amb `icomma`, `y(0,0)` es llegeix com el decimal "0,0". Cal escriure `y(0, 0)`, `(x, t)`, `(-2, 0, -2\pi)`, amb espai després de la coma.
- **Accents dins de fórmules:** es perden sense cap avís (`\theta_{límit}` surt "lmit"). Cal fer servir `\theta_{\textit{límit}}` o `\text{…}`. Tampoc no es poden posar accents dins de `\mathrm{…}`.
- **Apartats amb diversos paràgrafs:** es pot deixar una línia en blanc dins d'`apartat`, i el sagnat es conserva.
- **"Dada:" en singular** (o una altra etiqueta): `\blocetiquetat{Dada:}{…}`.
- **Figures una al costat de l'altra:** dues `minipage`, cadascuna amb el seu `\figura` (mai `\includegraphics`, que està prohibit).
- **Peus de figura** de l'original ("Figura 1. …"): s'escriuen com a text LaTeX sota la figura, no dins del retall.
- **YAML:** el bloc "Física relativista, quàntica i nuclear" conté comes. Dins d'una llista en línia s'ha d'escriure entre cometes: `blocs_secundaris: ["Física relativista, quàntica i nuclear"]`.
- **Punts decimals de la pauta** (`1.346`): es passen a coma (`1,346`). És l'única normalització permesa, a més de les errates tipogràfiques trivials d'extracció ("m/si" → "m/s").

## Figures

- Es **retallen del PDF** a PNG a 300 dpi amb `eines/pagina.py retalla`. Els dibuixos dels PDF són vectorials, i el retall en fa un raster net.
- Noms: `fig1.png`, `fig2.png`… per a l'enunciat (en ordre d'aparició) i `sol_fig1.png`… per a la solució.
- El retall ha d'incloure les etiquetes de la figura (textos com "Càtode", eixos, llegendes) i **no** ha d'incloure:
  - les caixes de puntuació ("Puntuació de l'apartat…");
  - text de paràgrafs;
  - números de pàgina;
  - el logo de la capçalera de les pautes.
- Si una figura queda "enganxada" al text del costat (maquetació en dues columnes), es retalla només la figura.
- Els **gràfics** i les **taules complexes com a imatge** a la pauta també són figures.
- Les imatges decoratives o de context que no calen per resoldre l'exercici (fotos) també es retallen, per fidelitat.
- Cada figura es declara a `metadades.yaml` → `figures`.

Flux de treball recomanat:
```bash
python3 eines/pagina.py render  PDF PAG pag.png --graella --dpi 110   # veure coordenades
python3 eines/pagina.py figures PDF PAG                               # suggeriments de caixes
python3 eines/pagina.py retalla PDF PAG x0 y0 x1 y1 carpeta/fig1.png  # retall final (300 dpi)
```
Després de retallar, **mira el PNG** per comprovar que és complet i net.

## `metadades.yaml`

```yaml
id: 2026_ord_s1_E1A_nanosatellit-orbita-circular   # = nom de la carpeta
titol: Nanosatèl·lit de la Generalitat en òrbita circular   # curt i descriptiu, en català
resum: >-            # 1–2 frases: què es demana (serveix per cercar)
  Deducció del període orbital…
font:
  tipus: examen      # examen | model | mostra
  any: 2026
  convocatoria: ordinaria   # ordinaria | extraordinaria | model | mostra
  serie: 1           # número de sèrie; per a mostres: optica | moment-angular | experiments
  exercici: 1        # número original de l'exercici (E1 → 1, P3 → 3)
  opcio: A           # A | B | null
  pdf_enunciat: examenes/pau_fisi26jl.pdf   # ruta relativa a l'arrel del projecte
  pagines_enunciat: [2]
  pdf_solucio: examenes/pau_fisi26jp.pdf
  pagines_solucio: [2]
format: nou          # nou (2025+, 4 exercicis) | antic (≤2024)
curriculum: actual   # actual | parcial | antic (vegeu més avall)
bloc: Camps gravitatoris        # UN bloc de taxonomia.yaml
blocs_secundaris: []            # altres blocs si l'exercici en toca més d'un
subtemes: [...]                 # 1–4 subtemes EXACTES de taxonomia.yaml
paraules_clau: [...]            # 4–10 termes lliures en català (context, conceptes, dispositius)
tipus: [càlcul, qualitativa]    # de taxonomia.yaml
dificultat: 2                   # 1–5, segons la rúbrica de taxonomia.yaml
justificacio_dificultat: >-     # 1–2 frases
  …
punts_total: 2.5
apartats:
  - etiqueta: "1.1"             # etiqueta original ("1.1", "a", "b"…)
    punts: 1.25
    resum: Deduir T(r, M_T) i calcular el període.
figures:
  - fitxer: fig1.png
    on: enunciat                # enunciat | solucio
    descripcio: Tub de raigs X amb càtode, ànode i electró
solucio_oficial: true           # false si no hi ha pauta oficial
revisat: false                  # el professor el posarà a true quan l'hagi revisat
notes: ""                       # dubtes de transcripció, repartiment de punts supòsit, etc.
```

### Currículum (`curriculum`)

Indica si l'exercici encaixa en el currículum actual de 2n de batxillerat (decret 171/2022; guia oficial: `documents oficials/02_pau25_fisicaCurriculum.pdf`).

| valor | quan |
|---|---|
| `actual` | Tots els apartats es poden demanar avui a la PAU. |
| `parcial` | Algun apartat queda fora del currículum. A `notes` s'indica quin i per què. |
| `antic` | L'exercici sencer tracta temes que ja no s'avaluen. A `notes` s'indica per què. |

El currículum actual és gairebé igual que l'anterior (decret 142/2008). Queden **fora**, segons la guia oficial:
- les transformacions de Lorentz i els càlculs quantitatius de dilatació del temps o contracció de la longitud (només s'avaluen de manera qualitativa);
- els problemes quantitatius de cos negre i del principi d'incertesa;
- la llei de Gauss i les equacions de Maxwell;
- el tractament matemàtic per obtenir l'ona resultant d'una interferència;
- els temes que són només de 1r de batxillerat o d'altres matèries: mecànica sense camps (xocs, plans inclinats, dinàmica de rotació, molles fora del MHS), circuits de corrent continu, termodinàmica.

El currículum és obert: si l'enunciat dona el context necessari per resoldre un apartat, l'apartat compta com a `actual`. En cas de dubte, `actual` i una nota.

### Rúbrica de dificultat (relativa al nivell PAU)

| | |
|---|---|
| 1 | Aplicació directa: un concepte, una fórmula, dades explícites. |
| 2 | Dos passos encadenats o dos conceptes estàndard; enunciat guiat. |
| 3 | Problema PAU típic: diversos passos, cal triar el principi (Newton, conservació…) i justificar breument. |
| 4 | Combina conceptes o requereix interpretar gràfics/dades/context poc habitual, vectors en 3D o raonament qualitatiu fi. |
| 5 | Context nou o complex, cal modelitzar, deduccions poc guiades, molts passos o subtileses conceptuals. |

La valoració és subjectiva. Es fa pensant en un alumne mitjà de 2n de batxillerat que prepara la PAU, i la puntuació 3 és el "problema PAU normal".

## `convocatories/<conv>/info.yaml`

```yaml
id: 2026_ord_s1
any: 2026
convocatoria: ordinaria      # ordinaria | extraordinaria | model | mostra
serie: 1
format: nou
pdf_enunciat: examenes/pau_fisi26jl.pdf
pdf_solucio: examenes/pau_fisi26jp.pdf
instruccions: >-             # instruccions de l'examen original (text pla)
  …
exercicis:                   # ids en l'ordre de l'examen original
  - 2026_ord_s1_E1A_…
  - 2026_ord_s1_E1B_…
```

`criteris_generals.tex`: els "Criteris generals d'avaluació i qualificació" del principi de la pauta, en un `enumerate`. Si la pauta no en té, no es crea.

## Validació

```bash
python3 eines/comprova.py base_dades/exercicis/<id> --png   # valida, compila i genera PNG per revisar
python3 eines/comprova.py --tot                             # tots
python3 eines/index.py --resum                              # regenera l'índex
```

Un exercici està acabat quan `comprova.py` dona `[OK]` sense avisos rellevants i la previsualització s'ha comparat visualment amb el PDF original.
