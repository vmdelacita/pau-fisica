# Lot 2a (exàmens de 2016–2018): resum

**Data:** 2026-09-24 · **Estat:** acabat i publicat
Pla i decisions: `PLA_EXAMENS_ANTICS.md`. Resum anterior: `RESUM_LOT1.md`.

## 1. Decisions preses a l'inici de la sessió

- **Exercicis que no es poden resoldre tal com són:** només una nota a `notes` i un comentari `% DUBTE:`, com al lot 1. La web no canvia.
- **Pregunta Q5 de les mostres de 2025 (càpsula de Petri):** és el P4 de l'opció B de juny de 2017, **sèrie 1**.
  - No s'ha creat cap exercici nou per a aquest problema. S'ha copiat la pauta oficial a la Q5, que conserva el seu identificador.
  - `2025_mostra_experiments_Q5_capsula-petri-equipotencials` ara té:
    - `solucio_oficial: true`;
    - la pauta de `pau_fisi17jp.pdf` (pàgina 8), amb la figura de les equipotencials;
    - **2,5 punts (1,25 + 1,25)**, com la resta de preguntes de format nou. A 2017 valia 1 + 1; les puntuacions parcials de la pauta s'han reescalat ×1,25 (decisió del professor, vegeu el final).
  - A la convocatòria `2017_ord_s1`, la Q5 ocupa la posició del P4B.

## 2. Exercicis incorporats

**71 exercicis nous** de 9 sèries, més la Q5 completada. La base de dades en té ara **238**.

Els 12 PDF originals s'han copiat a `examenes/` amb el nom actual (`pau_fisi16jl.pdf`, `pau_fisi16jp.pdf`, etc.).

| Convocatòria | Sèries | Exercicis |
|---|---|---|
| 2016 juny | S3, S5 | 16 |
| 2016 setembre | S1 | 8 |
| 2017 juny | S1, S5 | 15 + Q5 |
| 2017 setembre | S2 | 8 |
| 2018 juny | S1, S5 | 16 |
| 2018 setembre | S3 | 8 |

- Totes les sèries tenen el mateix format: part comuna P1–P2 i opció A/B (P3–P5), amb 2 punts per problema. Tots els PDF són escanejats.
- **Punts dels apartats:** els enunciats d'aquests anys no els donen. S'han pres de la pauta, que dona 1 + 1 a tots els problemes, i s'indica a `notes`.
- **Per bloc:**
  - Camps electromagnètics: 30
  - Física relativista, quàntica i nuclear: 17
  - Vibracions i ones: 14
  - Camps gravitatoris: 10
- **Per dificultat:** 1 → 6 · 2 → 33 · 3 → 32.
- **Currículum:** tots 71 són `actual`.
- **Subtemes:** no se n'ha afegit cap de nou. Només «naturalesa de la llum» continua sense cap exercici.
- **Figures:** 75 de noves, i 1 més a la Q5.

## 3. Com s'ha fet

1. **Transcripció:** 9 subagents Opus, un per sèrie, amb un màxim de 5 alhora. Quan n'acabava un, se'n llançava un altre.
   - No s'ha arribat al límit d'ús i no hi ha hagut pauses.
   - Cada subagent ha fet servir entre 125 000 i 175 000 tokens.
   - Les instruccions demanaven menys imatges al context: renderitzar cada pàgina una sola vegada a 150 dpi i ampliar només les fórmules dubtoses.
   - També demanaven comprovar que hi són totes les figures i quadrícules que l'enunciat esmenta.
2. **Revisió de conjunt:**
   - `comprova.py --tot`: 238 exercicis, 0 errors.
   - Cap accent perdut dins de fórmules.
   - Cerca d'enunciats que esmenten una figura que no hi és: no en falta cap. Els casos detectats demanen a l'alumne que dibuixi, i l'original no hi té quadrícula.
   - Revisió visual per mostreig, amb el PDF original al costat.
   - Els càlculs de les pautes amb possibles errors s'han refet.
3. **Compilació al navegador:** els 72 exercicis nous o modificats compilen amb el motor de la web (**144 de 144**, enunciat i solució). Tampoc no queda cap ordre LaTeX sense convertir a la vista HTML.

### Correccions fetes durant la revisió

- **2017 juny S1 P4A:** un subratllat llarg a la pauta no es partia i sortia del marge a la web. Ara es subratlla paraula a paraula.
- **2017 juny S5 P4B:** una puntuació parcial entre parèntesis, «(0.2 p)», s'havia escrit amb color directe. Ara és `\punts{0,2}`, perquè el solucionari (Fase 4) la pugui reescalar.

## 4. Errors de les pautes originals

**11 exercicis** tenen comentaris `% DUBTE:`. Estan transcrits tal com són i llistats a `base_dades/REVISIO_PENDENT.md`, a la secció «Lot 2a». Tres casos que convé mirar:

- **2016 juny S3 P4B (potassi 40):** l'**enunciat** diu que el fotó gamma és de «1 460 MeV» (comprovat a l'original). El valor real és 1 460 keV. Amb MeV, la pauta obté una disminució de massa més gran que la massa d'un nucleó.
- **2018 juny S5 P5A:** la pauta calcula ε(1,28 s) = 0,247 V amb el sinus en **graus**. En radians dona −0,239 V. També escriu «ω = 2π rad» en lloc de 20π rad/s.
- **2017 juny S1 P5B:** un valor intermedi de la pauta (2,36·10⁶) no quadra amb el càlcul (2,44·10⁶). El resultat final sí que és correcte.

## Dubtes per al lot 2b (2013–2015): respostes del professor (2026-09-24)

1. **2016 juny S3 P4B (1 460 MeV):** es deixa tal com és. Queda a `REVISIO_PENDENT.md` perquè el professor el revisi a mà.
2. **Q5 de 2025:** com que pertany a un examen amb problemes de 2,5 punts, es manté a **2,5 punts**. La pauta oficial de 2017 s'ha reescalat ×1,25 (0,5/0,2/0,3 → 0,625/0,25/0,375; 0,2/0,6/0,2 → 0,25/0,75/0,25).
3. **Lot 2b:** 9 sèries en una sola sessió, amb el mateix mètode que el lot 2a.
