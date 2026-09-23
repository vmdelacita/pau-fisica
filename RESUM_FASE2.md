# Fase 2 — Extracció d'exercicis i solucions: resum

**Data:** 2026-09-22 · **Estat:** acabada
El pla general del projecte i les decisions prèvies són a `RESUM_FASE1.md`.

## Resultat

La base de dades conté **79 exercicis** en LaTeX, cadascun amb:
- l'enunciat;
- la pauta oficial transcrita tal com és;
- les metadades per cercar-lo;
- les figures retallades del PDF (130 PNG en total).

Els 79 exercicis validen i compilen amb Tectonic, en uns 30 segons en total.

| Font | Convocatòries | Exercicis |
|---|---|---|
| PAU 2023 (format antic, P1–P7) | ord. Sèrie 1, ord. Sèrie 5, ext. Sèrie 2 | 21 |
| PAU 2024 (format antic) | ord. Sèrie 1, ext. Sèrie 3 | 14 |
| PAU 2025 (format nou) | ord. Sèrie 1, ext. Sèrie 3 | 12 |
| PAU 2026 (format nou) | ord. Sèrie 1, ext. Sèrie 2 | 12 |
| Model 2025 (Sèrie 0) | 1 | 6 |
| Mostres 2025 | òptica (4), moment angular (5), preguntes experimentals (5) | 14 |

- **Per bloc:**
  - Camps electromagnètics: 23
  - Vibracions i ones: 23
  - Camps gravitatoris: 17
  - Física relativista, quàntica i nuclear: 16
- **Per dificultat:** 2 → 21 exercicis · 3 → 49 · 4 → 9. No n'hi ha cap d'1 ni de 5.
- Cada **opció A/B** és un exercici separat (p. ex. `2026_ord_s1_E1A_…`, `2026_ord_s1_E1B_…`).

## Estructura creada

```
pau fisica/
├── base_dades/
│   ├── FORMAT.md             ← ESPECIFICACIÓ del format (llegir-la abans de tocar res)
│   ├── REVISIO_PENDENT.md    ← 16 exercicis amb possibles errors a la pauta original
│   ├── exercicis/<id>/       ← 79 carpetes: enunciat.tex, solucio.tex, metadades.yaml, *.png
│   ├── convocatories/<conv>/ ← 13 carpetes: info.yaml (instruccions + ordre) i criteris_generals.tex
│   ├── index.json / index.csv← índex generat (no editar)
│   └── _build/               ← previsualitzacions PDF/PNG (generat, al .gitignore)
├── eines/
│   ├── taxonomia.yaml        ← blocs, 43 subtemes, tipus i rúbrica de dificultat
│   ├── preambul_exercicis.tex← macros LaTeX dels fragments (\figura, apartat, \dades, \punts…)
│   ├── pagina.py             ← renderitzar pàgines / llegir text / retallar figures dels PDF
│   ├── comprova.py           ← validar + compilar exercicis (previsualització)
│   └── index.py              ← generar index.json / index.csv
├── .gitignore
└── RESUM_FASE1.md, RESUM_FASE2.md
```

Identificador de cada exercici: `{any}_{ord|ext|model|mostra}_{sèrie}_{E1A|P3|Q1}_{descriptor}`, per exemple `2023_ord_s5_P3_molla-mhs-grafica`.

## Ordres útils

```bash
python3 eines/comprova.py --tot --png                  # valida i compila tot
python3 eines/comprova.py base_dades/exercicis/<id>    # un sol exercici
python3 eines/index.py --resum                         # regenera l'índex i en mostra estadístiques
```
Requisits instal·lats en aquest Mac:
- `tectonic` (Homebrew);
- `PyMuPDF`;
- `PyYAML` (`pip3 install --user pyyaml`), per a Python 3.9 del sistema.

## Com s'ha fet

1. Primer es van crear les eines i el format, i un **exercici pilot** (`2026_ord_s1_E1A`) que ha servit de referència.
2. Després, **11 subagents en paralel** van transcriure cadascun una convocatòria o un document de mostra. Tots seguien `FORMAT.md` i van comparar la seva previsualització amb el PDF original.
3. Finalment, una revisió de conjunt:
   - validar i compilar tot;
   - comprovar que no hi ha accents perduts dins de fórmules;
   - revisar visualment diversos exercicis;
   - regenerar l'índex.

### Canvis fets durant la revisió
- **Taxonomia:** s'hi han afegit 3 subtemes que diversos exercicis necessitaven, i s'han reetiquetat els 5 exercicis afectats:
  - "equilibri de càrregues en camps elèctrics" (Millikan, gotes);
  - "ressonància i harmònics en tubs i cordes";
  - "model de Bohr i espectres atòmics".
- **Preàmbul:**
  - Els apartats de diversos paràgrafs ja conserven el sagnat (l'entorn `apartat` ara és una llista).
  - La "l·l" es compon bé escrivint el caràcter UTF-8 (`newunicodechar`). **Cal portar aquesta correcció a la plantilla d'examen de la Fase 3.**
- `FORMAT.md` recull els casos especials trobats:
  - la coma dels decimals amb coordenades (`y(0, 0)`);
  - els accents dins de fórmules;
  - les cometes en YAML;
  - les figures una al costat de l'altra.

## Observacions i coses a revisar

- **`base_dades/REVISIO_PENDENT.md`**: llista de 16 exercicis on la pauta oficial té errors o incoherències. Alguns exemples:
  - 2025 model E1B: 24 h = 8,64·10⁵ s.
  - 2023 ord. S1 P6: interval "de 4 a 8".
  - 2026 ext. E3A: n = 3 en lloc de n = 2.

  S'han transcrit **tal com són**, amb `% DUBTE:`. Quan revisis un exercici, posa `revisat: true` a les metadades.
- **Dificultat:** la valoració ha quedat entre 2 i 4. Té sentit, perquè la PAU no té problemes trivials ni extrems, però si vols més rang per filtrar es pot recalibrar (p. ex. passant els "2" més directes a 1).
- **Punts:**
  - `2025_mostra_moment-angular_P2` val 2 punts (1 + 1), com a l'original.
  - En algunes mostres, els punts per apartat els ha repartit el transcriptor (queda anotat a `notes`).
- **Preguntes experimentals:** no tenen solució oficial (`solucio_oficial: false`). La Q5 és un exercici de la PAU 2017 (juny, opció B, P4): quan s'afegeixin els exàmens antics, es podria substituir per la versió amb pauta.
- **Subtemes sense cap exercici:**
  - generadors, motors i transformadors;
  - efecte Doppler;
  - naturalesa de la llum;
  - relativitat especial.

  Són temes del currículum nou que encara no han sortit. Els exàmens antics en poden aportar.
- **Criteris generals:** les pautes de 2023–2024 penalitzen diferent de les de 2025–2026 (errors d'unitats i de càlcul). Cada convocatòria guarda els seus a `criteris_generals.tex`, cosa útil per a la Fase 4.
- **Ubicació de les figures:** quan una figura anava al costat del text (maquetació a dues columnes), s'ha col·locat abans o després del paràgraf corresponent.

## Dubtes a resoldre abans de la Fase 3 (aplicació)

1. **Tecnologia de l'app:**
   - (a) App web local en Python (servidor + interfície al navegador), empaquetada per a Mac, Windows i Linux amb PyInstaller i amb Tectonic inclòs. És la més senzilla de mantenir.
   - (b) App d'escriptori amb Tauri o Electron. Té un aspecte més "natiu", però és més complexa.
2. **Dades al repositori públic:** incloure-hi la base de dades (material de la Generalitat) i els logos, o publicar només el codi i distribuir les dades a part?
3. **Edició d'exercicis:** els canvis fets a l'app han de modificar la base de dades (permanent) o només la còpia de l'examen que s'està fent?
4. **Format de l'examen generat:**
   - Numeració dels apartats: "1.1" o "a)".
   - Mostrar els punts de cada apartat?
   - Deixar espai per respondre?
   - Plantilla diferent per a "full d'exercicis"?
5. **Sortida:** només PDF, o també el `.tex` per poder-lo retocar?
6. **Idioma de la interfície:** català?
7. **Revisió:** vols poder marcar els exercicis com a "revisat" i editar-ne les metadades (dificultat, temes) des de l'app?
