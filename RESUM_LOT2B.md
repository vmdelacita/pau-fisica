# Lot 2b (exàmens de 2013–2015): resum

**Data:** 2026-09-24 · **Estat:** acabat i publicat
Pla i decisions: `PLA_EXAMENS_ANTICS.md`. Resum anterior: `RESUM_LOT2A.md`.

## 1. Decisió presa durant la sessió

- **P1 de setembre de 2014 (sèrie 5):** és el mateix problema que `2025_mostra_moment-angular_P4_satellit-canvi-orbita` (satèl·lit de 2 000 kg a 3 630 km que passa a una òrbita el·líptica). La mostra de 2025 hi afegeix el càlcul i la valoració del moment angular a P i A, i té una resolució pròpia.
  - Decisió del professor: **només enllaçar**. No s'ha creat cap exercici nou i no s'ha guardat la pauta de 2014.
  - A la convocatòria `2014_ext_s5`, la mostra ocupa la posició del P1.
  - A les `notes` de la mostra s'ha afegit que és el P1 de setembre de 2014 (pàgina 1 de l'enunciat i de la pauta), on valia 1 + 1 punts. No s'hi ha canviat res més.

## 2. Exercicis incorporats

**71 exercicis nous** de 9 sèries. La base de dades en té ara **309**.

Els 12 PDF originals s'han copiat a `examenes/` amb el nom actual (`pau_fisi13jl.pdf`, `pau_fisi13jp.pdf`, etc.).

| Convocatòria | Sèries | Exercicis |
|---|---|---|
| 2013 juny | S4, S3 | 16 |
| 2013 setembre | S1 | 8 |
| 2014 juny | S3, S4 | 16 |
| 2014 setembre | S5 | 7 + P1 enllaçat a la mostra |
| 2015 juny | S2, S4 | 16 |
| 2015 setembre | S5 | 8 |

- Totes les sèries tenen el mateix format que el lot 2a: part comuna P1–P2 i opció A/B (P3–P5), amb 2 punts per problema. Tots els PDF són escanejats.
- **Punts dels apartats:** l'enunciat no els dona. S'han pres de la pauta, que dona 1 + 1 a tots els problemes, i s'indica a `notes`.
- **Criteris generals:** només les pautes de 2015 en tenen (`2015_ord_s2`, `2015_ord_s4` i `2015_ext_s5`). Les de 2013 i 2014 comencen directament amb els problemes.
  - A la pauta de juny de 2015, els criteris de la sèrie 4 continuen la numeració de la sèrie 2 (del 10 al 18) i s'ha mantingut així.
  - En aquests criteris, un error d'unitats resta el 50 % del subapartat, no el 20 % dels anys posteriors.
- **Per bloc:**
  - Camps electromagnètics: 29
  - Física relativista, quàntica i nuclear: 17
  - Vibracions i ones: 15
  - Camps gravitatoris: 10
- **Per dificultat:** 1 → 4 · 2 → 34 · 3 → 31 · 4 → 2.
- **Currículum:** tots 71 són `actual`.
- **Subtemes:** no se n'ha afegit cap de nou.
- **Figures:** 70 de noves.
- **Exercicis semblants a altres d'antics** (creats igualment, amb una nota): l'agulla de la màquina de cosir (`2014_ord_s4_P5A`, semblant a `2017_ord_s1_P3B`) i la corda de violí de 32 cm i 196 Hz (`2014_ord_s4_P5B`, mateixes dades que `2021_ext_s1_P3` però preguntes diferents).

## 3. Com s'ha fet

1. **Transcripció:** 9 subagents Opus, un per sèrie, amb un màxim de 5 alhora, com al lot 2a.
   - No s'ha arribat al límit d'ús i no hi ha hagut pauses.
   - Cada subagent ha fet servir entre 125 000 i 155 000 tokens.
   - Nou a les instruccions: abans de crear cada exercici, buscar-ne les dades distintives als exàmens de format nou (2023–2026, mostres i model) per detectar-ne duplicats. Només ha sortit el cas de la secció 1.
2. **Revisió de conjunt:**
   - `comprova.py --tot`: 309 exercicis, 0 errors.
   - Cap accent perdut dins de fórmules als exercicis nous.
   - Cerca d'enunciats i pautes que esmenten una figura que no hi és: no en falta cap.
   - Revisió visual per mostreig, amb el PDF original al costat.
3. **Compilació al navegador:** els 72 exercicis nous o modificats compilen amb el motor de la web (**144 de 144**, enunciat i solució). No queda cap ordre LaTeX sense convertir a la vista HTML.

### Casos particulars de la transcripció

- **2015 setembre S5 P5B:** a la pauta, un requadre «0,5 =» agrupa amb una clau tres passos de 0,1 + 0,1 + 0,3. S'ha transcrit tal com és, i per això la suma dels `\punts{}` de l'apartat a dona 1,5, tot i que l'apartat val 1. Al solucionari (Fase 4) caldrà tenir-ho en compte en reescalar.
- **2015 juny S4 P2:** «Descomptarem 0,1 per cada mancança» porta el 0,1 en requadre vermell. S'ha escrit amb `\punts{0,1}`, però és un descompte, no una puntuació parcial.
- **2015 setembre S5 P4A:** a la figura de la pauta, una fórmula de l'original trepitjava el dibuix i s'ha esborrat del retall.

## 4. Errors dels originals

**11 exercicis** tenen comentaris `% DUBTE:`, tots per errors de la pauta. També hi ha **3 enunciats** per revisar. Tot plegat és a `base_dades/REVISIO_PENDENT.md`, a la secció «Lot 2b». Els casos que convé mirar:

- **2013 juny S4 P4A (americi 241):** l'enunciat pregunta «des del 1944 fins ara». La pauta calcula amb el 2013. Si es posa en un examen, cal canviar l'any.
- **2013 setembre S1 P4B (clarinet):** l'enunciat anomena «tercer harmònic» un mode amb L = 5λ/4, que és el cinquè harmònic.
- **2014 setembre S5 P3B:** l'enunciat anomena «ànode» l'elèctrode que emet els electrons, al revés del que és habitual.
- **2015 juny S4 P4B (boia):** la pauta calcula E_c = 1,85 J. Amb la velocitat que dona (1,6 m/s) surt 1,92 J.

## Dubtes per al lot 3

Dels PDF de 2009–2012:

- **2010–2012** tenen el mateix format que 2013–2018: P1–P2 i opció A/B, amb 2 punts per problema. Són **10 sèries**: juny de 2010 en té tres (S1, S4, S5), juny de 2011 i de 2012 en tenen dues, i cada setembre en té una.
- **2009** té el format antic. Hi ha un problema i dues qüestions comunes, i l'opció B té **qüestions d'elecció múltiple**, amb puntuació negativa per a les respostes errònies.

1. **Proposta:** el lot 3 passa a ser **2010–2012 (10 sèries)**, en una sola sessió, amb el mateix mètode. El 2009 passa al lot 4, amb la resta d'exàmens de format antic. D'acord?
2. **Juny de 2010:** es transcriuen les **tres sèries**? Fins ara s'han fet totes les sèries de cada PDF.
3. **Lot 4, per anar-hi pensant:** com volem les qüestions d'elecció múltiple? La proposta és posar cada qüestió com un exercici, amb les opcions en una llista i la resposta correcta a la solució. S'han de marcar amb un tipus nou (`elecció múltiple`) a la taxonomia?
