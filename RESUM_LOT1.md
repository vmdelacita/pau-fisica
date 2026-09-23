# Lot 1 (exàmens de 2019–2022): resum

**Data:** 2026-09-23 · **Estat:** acabat i publicat
Pla i decisions: `PLA_EXAMENS_ANTICS.md`. Resum anterior: `RESUM_FASE3.md`.

## 1. Tasca prèvia: revisió només per al professor (feta)

- La pestanya **Revisió** i el comptador només es veuen en **mode revisió**, que s'activa obrint la web amb `?revisio`: <https://vmdelacita.github.io/pau-fisica/?revisio>.
  - El navegador ho recorda. `?revisio=0` el desactiva, i també hi ha l'enllaç «Surt del mode revisió» a la mateixa pestanya.
  - La pestanya «Revisió» de la fitxa de l'exercici també queda amagada fora d'aquest mode.
- Tothom veu l'etiqueta **«✓ Revisat per un humà»** als exercicis amb `revisat: true`, tant a la llista com a la fitxa.
  - El filtre de revisió és visible per a tothom, amb les opcions «Sense revisar», «Revisats per un humà» i «Amb dubtes».
  - Els visitants només veuen la base de dades publicada.
  - En mode revisió, les revisions locals que encara no s'han aplicat surten com a **pendents**: «Revisat per un humà (pendent)», amb una vora discontínua.
- Documentat al `README.md`, a la secció «Revisió de la base de dades».

## 2. Camp `curriculum` (fet)

- A `metadades.yaml` hi ha el camp nou `curriculum: actual | parcial | antic`. Els 79 exercicis anteriors són `actual`.
- `comprova.py` el valida. Si és `parcial` o `antic`, exigeix una explicació a `notes`.
- També s'ha afegit a:
  - l'índex (`index.csv` i el resum de l'`index.py`);
  - `aplica_revisions.py`, per poder-lo revisar des de la web.
- A la web:
  - un filtre «Currículum», que per defecte mostra tots els exercicis;
  - les etiquetes vermelles «Fora del currículum» i «Parcialment fora del currículum», amb la nota explicativa en passar-hi el ratolí;
  - un selector a la fitxa de revisió.
- `FORMAT.md` recull els criteris, extrets de la guia oficial `02_pau25_fisicaCurriculum.pdf`, i les convencions dels exàmens antics:
  - identificadors `P3A`/`P3B`;
  - setembre = `ext`;
  - noms dels PDF;
  - PDF escanejats.

## 3. Exercicis incorporats

**88 exercicis nous** de 11 sèries (la base de dades en té ara **167**). Els PDF originals s'han copiat a `examenes/` amb el nom actual (`pau_fisi19jl.pdf`, etc.), i la fitxa de cada exercici hi enllaça.

| Convocatòria | Sèries | Exercicis | Format | PDF |
|---|---|---|---|---|
| 2019 juny | S1, S4 | 16 | Part comuna P1–P2 + opció A/B (P3–P5), 2 punts per problema | escanejat |
| 2019 setembre | S5 | 8 | ídem | escanejat |
| 2020 juny | S1, S3 | 16 | 8 problemes a escollir, 2,5 punts | escanejat |
| 2020 setembre | S4 | 8 | ídem | escanejat |
| 2021 juny | S2 | 8 | ídem | amb text |
| 2021 setembre | S1 | 8 | ídem | amb text |
| 2022 juny | S2, S5 | 16 | ídem | amb text |
| 2022 setembre | S3 | 8 | ídem | amb text |

- **Per bloc:**
  - Camps electromagnètics: 33
  - Física relativista, quàntica i nuclear: 23
  - Vibracions i ones: 18
  - Camps gravitatoris: 14
- **Per dificultat:** 1 → 3 exercicis · 2 → 30 · 3 → 46 · 4 → 9.
- **Currículum:** tots 88 són `actual`. El currículum de 2008 i el de 2022 coincideixen gairebé del tot en aquests blocs. Alguns exercicis fan servir continguts de 1r (la llei de Hooke a 2020 set. P2, la caiguda lliure a 2020 juny S1 P6), però l'enunciat dona el context necessari, i ho indiquen les `notes`.
- **Subtemes:** no se n'ha afegit cap de nou. Ara ja hi ha exercicis de «generadors, motors i transformadors», «efecte Doppler» i «relativitat especial». Només queda sense cap exercici «naturalesa de la llum».
- **119 figures noves.**

## 4. Com s'ha fet

1. **Transcripció:** 11 subagents en paral·lel, un per sèrie, seguint `FORMAT.md`. Cada subagent comparava la seva previsualització amb el PDF.
   - Per als 6 PDF escanejats (2019–2020) s'ha fet servir **Opus**, perquè cal llegir fórmules en imatges.
   - Per als 5 que tenen capa de text (2021–2022) s'ha fet servir **Sonnet**.
   - A mig lot, la sessió va arribar al límit d'ús. Quan es va restablir, cada subagent va continuar des del que ja tenia escrit al disc.
2. **Revisió de conjunt:**
   - `comprova.py --tot`: 167 exercicis, 0 errors.
   - Accents i símbols perduts dins de fórmules.
   - **Comprovació automàtica de xifres** (2021–2022): cada número transcrit s'ha buscat al text del PDF original, i els que no hi eren s'han comprovat a ull. No hi ha cap error.
   - Revisió visual per mostreig dels escanejats (tot el text, les taules de masses i les figures coincideixen).
   - Cerca d'enunciats que esmenten una figura que no hi és.
3. **Compilació al navegador:** tots els enunciats i totes les solucions dels **167** exercicis compilen amb el motor de la web (**334 de 334**).

### Correccions fetes durant la revisió

- **Motor LaTeX de la web:**
  - Faltaven les mètriques `rm-lmr7` i altres fonts OT1 de Latin Modern, que fan servir les taules amb `\small` i el text dins de subíndexs.
  - S'hi han afegit 43 fitxers `.tfm` del paquet `lm` de TeX Live i les línies corresponents de `pdftex.map`, i s'ha regenerat `texlive-pau.data` (16,5 MB).
  - Sense aquest canvi, 2 exercicis no compilaven a la web.
- **Preàmbul:** el símbol `°` ara també funciona dins de fórmules (abans es perdia sense avisar). Afectava 5 fórmules del lot.
- **`comprova.py`:** avisa si hi ha un `%` sense escapar a mitja línia, perquè la resta del text desapareix sense cap error.
- **Figures que faltaven:**
  - 2022 set. P2: la figura 1, amb els eixos i la càrrega, imprescindible.
  - Quadrícules en blanc on l'alumnat ha de dibuixar: 2022 set. P5 i 2022 juny S5 P5.
  - Ara `FORMAT.md` diu que les quadrícules en blanc també es retallen.
- **Altres:**
  - `Φ` en Unicode convertit a `$\Phi$`, i el `º` ordinal convertit en `°`.
  - Un accent perdut dins de `\mathrm{fotó}`.
  - Dos subratllats llargs que no es partien i sortien del marge.
  - Els separadors de milers s'han deixat com a l'original («20.000 W»), igual que a la resta de la base de dades.

## 5. Errors de les pautes originals

**19 exercicis** tenen comentaris `% DUBTE:`. Estan transcrits tal com són i llistats a `base_dades/REVISIO_PENDENT.md`, a la secció «Lot 1». Tres casos que convé mirar:

- **2022 set. P7 b):** la mateixa pauta reconeix que l'apartat no es pot resoldre, perquè falta la tensió del generador, i dona els 2,5 punts amb l'apartat a).
- **2022 set. P2 b):** la pauta no té cap criteri escrit per a aquest apartat, només la figura resolta.
- **2021 juny P7:** la pauta té intercanviades les etiquetes de les figures del fonamental i del tercer harmònic.

## Dubtes per al lot 2 (2013–2018)

1. **Exercicis que no es poden resoldre tal com són** (p. ex. 2022 set. P7 b): de moment hi són amb una nota. Vols que es marquin d'alguna manera, per exemple amb un avís a la fitxa, o que l'apartat quedi exclòs per defecte en afegir-lo a un examen?
2. **Mida del lot 2.**
   - Els PDF de juny contenen dues sèries, i aquest lot n'ha tingut 88 exercicis.
   - El lot 2 (12 convocatòries, totes escanejades) pot arribar als 140. Amb la mateixa mida hi ha el risc de tornar a topar amb el límit d'ús.
   - Proposo partir-lo en dues sessions: 2016–2018 i 2013–2015.
3. **Recordatori del lot 2:** substituir la pregunta experimental Q5 de les mostres de 2025 per la versió oficial de juny de 2017 (opció B, P4), que té pauta. Els identificadors existents no es canvien. Proposo afegir l'exercici de 2017 com a exercici nou i deixar la Q5 marcada a les `notes` com a duplicat. Hi estàs d'acord?
4. **Currículum:** en aquest lot tot ha quedat com a `actual`. Si en revisar-los trobes algun apartat que consideris fora del currículum, pots canviar-lo des de la pestanya Revisió. Els lots 3 i 4 (≤2012) probablement sí que en tindran més.
