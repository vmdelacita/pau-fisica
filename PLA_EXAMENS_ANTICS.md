# Publicació i pla per afegir els exàmens antics

**Data:** 2026-09-23
Resums anteriors: `RESUM_FASE1.md`, `RESUM_FASE2.md` (base de dades) i `RESUM_FASE3.md` (web).

## 1. Publicació (feta)

- **Web:** <https://vmdelacita.github.io/pau-fisica/>
- **Repositori públic:** <https://github.com/vmdelacita/pau-fisica>, branca `main`.
- Cada `git push` a `main` executa el workflow `publica-web.yml`, que regenera `web/dades/` i torna a publicar la web en uns 30 s. Els navegadors poden trigar fins a 10 minuts a veure la versió nova, pel temps de memòria cau de GitHub Pages.
- Prova feta sobre la web publicada amb Chrome headless: afegir 3 exercicis i generar el PDF (3,8 s, incloent-hi la descàrrega del motor). Cap error a la consola.
- `examenes antiguos/` és al `.gitignore` fins que s'incorporin els exàmens a la base de dades (vegeu el dubte 4).

Per publicar un canvi:

```bash
git add -A && git commit -m "Descripció del canvi" && git push
```

## 2. Decisions per a la Fase 4 (solucionari)

1. El solucionari és un **PDF a part**, amb la **mateixa capçalera** que l'examen.
2. Si s'han canviat els punts, les **puntuacions parcials de la pauta es reescalen** proporcionalment.
3. Els **apartats exclosos** de l'examen també s'**ometen** al solucionari.
4. S'hi inclouen els **criteris generals de correcció de la PAU**: els de la convocatòria original de cada exercici (`criteris_generals.tex`).
5. **Editar la solució** dels exercicis editats o propis queda com a **treball futur**, per a una versió posterior.

## 3. Exàmens antics: inventari

`examenes antiguos/` conté **43 convocatòries**, cadascuna amb 2 PDF: l'examen i les respostes (la pauta de correcció).

- **Juny:** 2000–2021.
- **Setembre:** 2000–2020.
- **Falten:** juny i setembre de 2022, i setembre de 2021.

Tots són **PDF escanejats sense capa de text**, excepte els de 2021. Cal transcriure'ls **visualment**: renderitzar cada pàgina i transcriure-la. `pagina.py` ja serveix per renderitzar les pàgines i retallar-ne les figures.

Formats trobats:

| Període | Estructura |
|---|---|
| 2021 | Format especial (8 problemes, a escollir) |
| ~2010–2020 | Part comuna P1–P2 + opció A o B (P3–P5). Cada problema val 2 punts |
| ~2000–2009 | Problemes i qüestions (P1, Q1–Q4), amb opcions A/B. Hi ha temes de mecànica (xocs, molles, energia) |

Un PDF de juny sol contenir **diverses sèries**. Les pautes de 2010 en endavant tenen la puntuació de cada pas, com les actuals. Les dels primers anys són més breus (1–2 pàgines).

## 4. Pla: 4 lots, un per sessió, del més recent al més antic

Els lots s'han equilibrat pel nombre de pàgines d'examen, per tenir una càrrega de feina semblant a cada sessió.

| Lot | Anys | Convocatòries | Pàgines d'examen |
|---|---|---|---|
| 1 | 2016–2021 (+ 2022 i setembre 2021, si els aconseguim) | 11 | ~76 |
| 2 | 2011–2015 | 10 | ~72 |
| 3 | 2008–2010 | 6 | ~80 |
| 4 | 2000–2007 | 16 | ~92 |

Cada lot segueix el mètode de la Fase 2:

1. Subagents en paral·lel, un per convocatòria, seguint `base_dades/FORMAT.md` i comparant la previsualització amb el PDF.
2. Revisió de conjunt: `comprova.py --tot`, accents, revisió visual i índex.
3. Comprovar que tots els exercicis compilen també **al navegador**. Si algun necessita un paquet LaTeX que el motor reduït no té, cal regenerar-lo (`eines/motor_tex/README.md`).
4. Marcar els temes que ja no són del currículum (vegeu el dubte 1).
5. Publicar (`git push`) i escriure `RESUM_LOTn.md`.

**Recordatori:** la pregunta experimental Q5 de les mostres de 2025 és el problema 4 de l'opció B de juny de 2017. En fer el lot 1, cal substituir-la per la versió oficial, que té pauta.

**Important:** no s'han de canviar mai els identificadors dels exercicis que ja existeixen. Els exàmens desats (`.json`) i les revisions fetes al navegador hi fan referència.

## 5. Dubtes abans del lot 1

1. **Com es marca el que és fora del currículum.** Proposta:
   - Afegir a `metadades.yaml` un camp `curriculum` amb tres valors: `actual`, `parcial` (només algun apartat en queda fora; s'indica a `notes`) o `antic`.
   - Afegir a la taxonomia els subtemes antics que calguin (p. ex. xocs i conservació de l'energia mecànica).
   - A la web, mostrar una etiqueta «Fora del currículum» i afegir un filtre. **Pregunta:** per defecte, el filtre ha de mostrar tots els exercicis o només els del currículum actual?
2. **Convocatòries que falten** (2022 i setembre de 2021): les descarregues tu i les poses a `examenes antiguos/`, o les busco jo al web de la Generalitat a l'inici del lot 1?
3. **Pautes breus dels primers anys:** proposta de transcriure-les tal com són i indicar a `notes` que són pautes resumides.
4. **PDF originals a la web.** Proposta:
   - Incloure'ls al repositori a mesura que s'incorporen, reanomenats amb el format actual (p. ex. `pau_fisi15jl.pdf`), perquè la fitxa enllaci a l'original.
   - Són uns 109 MB en total, dins dels límits de GitHub.
