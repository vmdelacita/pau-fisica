# Publicació i pla per afegir els exàmens antics

**Data:** 2026-09-23
Resums anteriors: `RESUM_FASE1.md`, `RESUM_FASE2.md` (base de dades) i `RESUM_FASE3.md` (web).

## 1. Publicació (feta)

- **Web:** <https://vmdelacita.github.io/pau-fisica/>
- **Repositori públic:** <https://github.com/vmdelacita/pau-fisica>, branca `main`.
- Cada `git push` a `main` executa el workflow `publica-web.yml`, que regenera `web/dades/` i torna a publicar la web en uns 30 s. Els navegadors poden trigar fins a 10 minuts a veure la versió nova, pel temps de memòria cau de GitHub Pages.
- Prova feta sobre la web publicada amb Chrome headless: afegir 3 exercicis i generar el PDF (3,8 s, incloent-hi la descàrrega del motor). Cap error a la consola.
- `examenes antiguos/` és al `.gitignore` fins que s'incorporin els exàmens a la base de dades (vegeu la secció 5, punt 4).

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

`examenes antiguos/` conté les **47 convocatòries** de juny i de setembre de 2000 a 2022, totes. Cadascuna té 2 PDF: l'examen i les respostes (la pauta de correcció).

- **2000–2020 i juny de 2021:** `Examen de Física <Juny|Setembre> <any> __ Selecat.cat.pdf` i `… __ respostes.pdf`. Els va aportar el professor.
- **Setembre de 2021 i tot 2022:** `pau_fisi21sl/sp.pdf` i `pau_fisi22jl/jp/sl/sp.pdf`, descarregats el 2026-09-23.
  - Els de 2022 vénen del web de la Generalitat, a `…/preparat-PAU/models-examen-anys-anteriors/examens-2022/fisica/{ord,ext}/`.
  - Els de setembre de 2021 ja no hi són. S'han baixat de les còpies dels documents oficials que va publicar betevé (`img.beteve.cat/wp-content/uploads/2021/09/`).

**Com s'han de transcriure:**
- 2000–2020: són PDF **escanejats sense capa de text**. Cal transcriure'ls **visualment**: renderitzar cada pàgina i transcriure-la. `pagina.py` ja serveix per renderitzar les pàgines i retallar-ne les figures.
- 2021 i 2022: tenen capa de text.
- Els PDF de 2021–2022 són més llargs perquè inclouen l'espai per respondre.

Formats trobats:

| Període | Estructura |
|---|---|
| 2021–2022 | Format especial: 8 problemes, a escollir |
| ~2010–2020 | Part comuna P1–P2 + opció A o B (P3–P5). Cada problema val 2 punts |
| ~2000–2009 | Problemes i qüestions (P1, Q1–Q4), amb opcions A/B. Hi ha temes de mecànica (xocs, molles, energia) |

Un PDF de juny sol contenir **diverses sèries**. Les pautes de 2010 en endavant tenen la puntuació de cada pas, com les actuals. Les dels primers anys són més breus (1–2 pàgines).

## 4. Pla: 4 lots, un per sessió, del més recent al més antic

Cal fer els 4 lots i, **després**, la **Fase 4 (solucionari)**.

Els lots són aproximats: es poden reajustar a l'inici de cada sessió. Els exàmens escanejats donen més feina que els que tenen text. Els exàmens de 2000–2008 són curts.

| Lot | Anys | Convocatòries | Pàgines d'examen |
|---|---|---|---|
| 1 | 2019–2022 | 8 | ~104 (moltes són espai per respondre) |
| 2 | 2013–2018 | 12 | ~72 |
| 3 | 2009–2012 | 8 | ~92 |
| 4 | 2000–2008 | 19 | ~116 |

Cada lot segueix el mètode de la Fase 2:

1. Subagents en paral·lel, un per convocatòria, seguint `base_dades/FORMAT.md` i comparant la previsualització amb el PDF.
2. Revisió de conjunt: `comprova.py --tot`, accents, revisió visual i índex.
3. Comprovar que tots els exercicis compilen també **al navegador**. Si algun necessita un paquet LaTeX que el motor reduït no té, cal regenerar-lo (`eines/motor_tex/README.md`).
4. Omplir el camp `curriculum` (vegeu la secció 5).
5. Copiar els PDF originals de la convocatòria a `examenes/`, reanomenats amb el format actual (vegeu la secció 5).
6. Publicar (`git push`) i escriure `RESUM_LOTn.md`.

**Recordatori:** la pregunta experimental Q5 de les mostres de 2025 és el problema 4 de l'opció B de juny de 2017. En fer el **lot 2**, cal substituir-la per la versió oficial, que té pauta.

**Important:** no s'han de canviar mai els identificadors dels exercicis que ja existeixen. Els exàmens desats (`.json`) i les revisions fetes al navegador hi fan referència.

## 5. Decisions del professor per als lots (2026-09-23)

1. **Currículum:**
   - Nou camp `curriculum` a `metadades.yaml`, amb tres valors: `actual`, `parcial` (algun apartat queda fora del currículum; s'indica a `notes`) o `antic`.
   - Els subtemes antics que calguin s'afegeixen a la taxonomia (p. ex. xocs i conservació de l'energia mecànica).
   - A la web: etiqueta «Fora del currículum» i filtre, que **per defecte mostra tots els exercicis**.
   - Els 79 exercicis actuals queden com a `actual`.
   - Al lot 1 cal adaptar `FORMAT.md`, `comprova.py`, `index.py`, `construeix_web.py`, la web i `aplica_revisions.py`, i fer que el camp també es pugui revisar des de la web.
2. **Convocatòries que faltaven:** descarregades (secció 3).
3. **Pautes breus dels primers anys:** es transcriuen tal com són i s'indica a `notes` que són pautes resumides.
4. **PDF originals:** es pugen al repositori a mesura que s'incorporen, reanomenats amb el format actual (`pau_fisi15jl.pdf` per a l'examen i `pau_fisi15jp.pdf` per a la pauta, amb `s` en lloc de `j` per a setembre). Així la fitxa de cada exercici enllaça a l'original.
5. **Ordre:** primer els 4 lots i després la Fase 4.

## 6. Tasca prèvia al lot 1: revisió només per al professor

Cal fer-la a l'inici de la propera sessió, abans de transcriure res.

- **La pestanya Revisió queda oculta** per a tots els visitants. Només apareix si s'obre la web amb `?revisio` a l'adreça (`https://vmdelacita.github.io/pau-fisica/?revisio`). En entrar-hi una vegada, el navegador ho recorda.
  - També s'amaguen la pestanya «Revisió» de la fitxa de l'exercici i el comptador.
  - Només és una manera d'amagar-la: qui conegui l'adreça pot obrir-la. No és un risc, perquè la pestanya només modifica el navegador de qui la fa servir. La base de dades només canvia amb `aplica_revisions.py` i `git push`.
- **Tothom veu si un exercici està revisat.** Els exercicis amb `revisat: true` a `metadades.yaml` mostren una etiqueta **«Revisat per un humà»** a la llista de resultats i a la fitxa.
  - El filtre «estat de revisió» de la cerca continua visible per a tothom.
  - Per als visitants, l'etiqueta i el filtre reflecteixen **només la base de dades publicada**, no les revisions desades al navegador. En mode revisió, el professor veu també les seves revisions locals encara no aplicades, destacades com a pendents.
- Actualitzar el `README.md` i la secció «Revisió» de la documentació.

## 7. Dubtes pendents

Cap. La propera sessió comença per la tasca de la secció 6 i després fa el **lot 1 (2019–2022)**.
