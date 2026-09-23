# Fase 1 — Documents: resum

**Data:** 2026-09-22 · **Estat:** acabada

## Pla general del projecte (encàrrec del professor)

**Context:** professor de Física de 2n de Batxillerat a Catalunya que prepara l'alumnat per a la PAU.
**Objectiu:** una petita aplicació per **cercar exercicis de la PAU d'anys anteriors, seleccionar-los, editar-los i compilar-los** en exàmens o fulls d'exercicis amb la plantilla del centre (`tex ejemplo/main.tex`).

**Manera de treballar:**
- El projecte es fa per fases.
- **Abans** de cada fase, Claude pregunta tots els dubtes.
- **Després** de cada fase, Claude s'atura i escriu un resum en Markdown (`RESUM_FASEn.md`) per poder continuar en una altra sessió.
- Si Claude té propostes de millora o troba a faltar documents, les ha de dir.

### Fase 1 — Documents ✅
- Identificar els documents rellevants i descarregar els que calguin.
- Fonts: `examenes/` (PDF ja descarregats), `tex ejemplo/` (plantilla i logos) i els PDF de la [pàgina oficial de Física](https://universitats.gencat.cat/ca/pau/materies-pau/fisica/#estructura-de-l%E2%80%99examen).
- `examenes antiguos/` s'ignora de moment i es farà servir més endavant per ampliar la base de dades.

### Fase 2 — Extracció d'exercicis i solucions ✅ (vegeu `RESUM_FASE2.md`)
- A partir dels PDF, generar una carpeta amb els **enunciats en LaTeX**, les **imatges en PNG** i les **solucions**.
- Objectiu: poder **cercar per paraules clau o per temes**.
- Afegir una **dificultat subjectiva de l'1 al 5** a cada exercici per poder-los filtrar.
- Les decisions ja preses són a la secció *Decisions per a la Fase 2* (més avall).

### Fase 3 — Aplicació ⏭️ (propera)
- Una app que es pujarà a un **repositori de GitHub**, **instal·lable a Mac, Linux i Windows**.
- Ha de permetre, de manera visual:
  - **cercar** problemes (per paraules clau, tema i dificultat);
  - **seleccionar-los**;
  - **modificar-los**, si cal;
  - **afegir-los a un examen**, que es compila amb la plantilla del centre (capçalera amb logos, dades del departament, trimestre, unitat i instruccions).
- Motor LaTeX triat: **Tectonic** (vegeu més avall).

### Fase 4 — Correcció automàtica
- Generar automàticament la **correcció** (el solucionari) de l'examen creat, a partir de les solucions de cada exercici seleccionat.

### Pendent per a més endavant
- Ampliar la base de dades amb els exàmens de `examenes antiguos/`.

## Què s'ha fet

1. **Inventari de `examenes/`** (12 PDF originals, 2023–2025).
2. **Descàrrega dels exàmens de 2026** (convocatòria ordinària i extraordinària), afegits a `examenes/`.
3. **Descàrrega dels 7 documents oficials** de la [pàgina de Física de la PAU](https://universitats.gencat.cat/ca/pau/materies-pau/fisica/) a `documents oficials/`.
4. **Instal·lació de [Tectonic](https://tectonic-typesetting.github.io/) 0.17.0** (`brew install tectonic`) com a motor LaTeX. S'ha comprovat que `tex ejemplo/main.tex` compila correctament. Per a la prova només s'ha substituït `loop.png`, que no existeix, per un requadre.
5. Els logos `tex ejemplo/senyal_bn.png` i `tex ejemplo/RCC.png` ja són al seu lloc (afegits pel professor).

## Estructura actual

```
pau fisica/
├── examenes/            ← exàmens PAU 2023–2026 (enunciats + criteris)
├── examenes antiguos/   ← buida de moment (per ampliar la base més endavant)
├── documents oficials/  ← material de referència de la PAU 2025+
├── tex ejemplo/         ← plantilla main.tex + senyal_bn.png + RCC.png
└── RESUM_FASE1.md
```

## Convenció de noms dels exàmens

`pau_fisi{AA}{c}{t}.pdf`
- `AA`: any (23…26)
- `c`: `j` = convocatòria ordinària (juny) · `s` = extraordinària
- `t`: `l` = **enunciat** · `p` = **pauta / criteris de correcció**

> ⚠️ El 2026 la web publica la pauta amb el sufix `t` (`pau_fisi26jt_v2.pdf`, `pau_fisi26st.pdf`). Els he **reanomenat** a `pau_fisi26jp.pdf` i `pau_fisi26sp.pdf` per mantenir la convenció. La versió de la pauta ordinària és la `v2` (corregida). **No** s'han descarregat les versions `_tei`, que són adaptades.

| Any | Ordinària (j) | Extraordinària (s) | Format |
|---|---|---|---|
| 2023 | Sèrie 1 **+ Sèrie 5** (32 pàg.) | Sèrie 2 | Antic: 7 problemes (P1–P7), cal respondre'n 4 |
| 2024 | Sèrie 1 | Sèrie 3 | Antic: 7 problemes, cal respondre'n 4 |
| 2025 | Sèrie 1 | Sèrie 3 | **Nou**: 4 exercicis (un per bloc), alguns amb opció A/B |
| 2026 | Sèrie 1 | Sèrie 2 | Nou |

El PDF de 2023 ordinària conté **dues sèries** (1 i 5), igual que la seva pauta, i per tant aporta el doble de problemes.

## Documents oficials (`documents oficials/`)

| Fitxer | Contingut | Ús previst |
|---|---|---|
| `01_pau25_fisica_0.pdf` | Examen de model (Sèrie 0, 2025) | Un examen més a la base de dades |
| `01_pau25_fisica_0c.pdf` | Criteris de correcció del model | Solucions del model |
| `02_pau25_fisica_Orientacions_v2.pdf` | Orientacions per a l'examen | Estructura i format de l'examen generat |
| `02_pau25_fisica_QuestionsExperiments.pdf` | Tipologia de preguntes d'anàlisi d'experiments | Nova etiqueta "experimental" |
| `02_pau25_fisica_MostraExercicis_optica.pdf` | Mostra d'exercicis d'òptica geomètrica | Exercicis extra (tema nou) |
| `02_pau25_fisica_MostraExercicis_moment-angular.pdf` | Mostra d'exercicis de moment angular | Exercicis extra (tema nou) |
| `02_pau25_fisicaCurriculum.pdf` | Conceptes avaluables a la PAU | **Base per a la taxonomia de temes** de la Fase 2 |

Estructura oficial de l'examen (2025+): 4 exercicis obligatoris de 2,5 punts, un per bloc (camps gravitatoris, camps electromagnètics, vibracions i ones, física relativista/quàntica/nuclear). Cada exercici té dos apartats, i dos dels exercicis ofereixen opció A/B.

## Propostes i observacions

- **Exàmens antics:** la reforma de 2025 va canviar el format i el currículum. Hi apareixen temes nous (òptica geomètrica, moment angular) i n'hi ha d'altres que potser ja no s'avaluen. En ampliar la base amb `examenes antiguos/`, convindrà marcar cada problema com a "format antic" i contrastar-lo amb `02_pau25_fisicaCurriculum.pdf`.
- **Model de dades:** proposo que la unitat de la base de dades sigui l'*exercici/problema* amb els seus *apartats* (cadascun amb la seva puntuació). Així es poden triar apartats solts.
- **Plantilla:** a `main.tex`, la "l·l" es veu com "col · lisió", amb espais. Es pot arreglar a la plantilla final (per exemple amb `\l.l` de babel-catalan o amb un caràcter adequat).
- **Repositori públic:** abans de pujar-ho a GitHub, cal decidir si s'hi inclouen els PDF i els enunciats extrets (material de la Generalitat) i els logos, o si només es publica el codi i cada usuari hi afegeix les dades.
- Recomano fer `git init` a l'inici de la Fase 3, o abans.

## Decisions per a la Fase 2 (respostes del professor)

1. **Idioma** de les metadades (temes, paraules clau): **català**.
2. **Taxonomia de temes:** els **4 blocs oficials** + **subtemes del currículum** (`02_pau25_fisicaCurriculum.pdf`), p. ex. *Camps gravitatoris → satèl·lits, energia orbital, lleis de Kepler…*
3. **Solucions:** transcriure la **pauta tal com és** a LaTeX, sense reescriure-la.
4. **Imatges:** **retallar les figures del PDF** com a PNG.
5. **Format de sortida:** **múltiples fitxers** amb **noms reconeixibles**, és a dir, un conjunt de fitxers per exercici (enunciat `.tex`, solució `.tex`, metadades i figures). Per exemple: `2025_juny_s1_E2A_camps-electromagnetics/`.
6. **Incloure** també el model (Sèrie 0, 2025) i les mostres d'òptica i de moment angular.

A més (acordat a l'enunciat del projecte): cada exercici tindrà una **dificultat subjectiva de l'1 al 5** i **paraules clau** per poder cercar-lo.
