# Exercicis PAU Física

Web per cercar exercicis de les PAU de Física de Catalunya (2023–2026, examen model i documents de mostra), seleccionar-los, editar-los i compondre'n **exàmens o fulls d'exercicis en PDF** amb la plantilla del centre. El PDF es compila amb LaTeX **dins del navegador**: no cal instal·lar res ni tenir cap servidor.

## Què fa la web

- **Cerca**: per paraules (sense tenir en compte accents), bloc, subtema, dificultat, tipus de tasca, any, procedència i format. Per a cada exercici es pot veure l'enunciat, la solució (pauta oficial) i els PDF originals.
- **Examen**: s'hi afegeixen exercicis i es poden reordenar, triar-ne els apartats, canviar els punts (o reescalar el total a 10) i editar-ne el LaTeX. Les edicions només afecten l'examen. També s'hi poden escriure exercicis propis. Els resultats possibles són:
  - el **PDF**;
  - una **carpeta .zip** amb el `.tex`, les imatges i el PDF, per retocar-la amb qualsevol LaTeX;
  - un projecte nou a **Overleaf**.

  Els exàmens es poden desar i tornar a obrir en format `.json`.
- **Revisió**: per marcar exercicis com a revisats i corregir-ne la dificultat, el bloc, els subtemes, el tipus i les paraules clau. Els canvis es desen al navegador i s'exporten a `revisions.json`, que s'aplica a la base de dades amb `eines/aplica_revisions.py`.

## Estructura

```
base_dades/     exercicis en LaTeX + metadades (vegeu base_dades/FORMAT.md)
eines/          scripts de manteniment (Python 3 + PyYAML)
  construeix_web.py    base_dades/ -> web/dades/
  aplica_revisions.py  revisions.json -> base_dades/
  serveix_web.py       servidor local per provar la web
  comprova.py, index.py, pagina.py   validació i extracció (fase 2)
  motor_tex/           com s'ha construït el motor LaTeX reduït
web/            la web estàtica (és el que es publica)
  plantilla/examen.tex plantilla del centre (editable)
  motor/               LaTeX en WebAssembly (BusyTeX)
  dades/               GENERAT per construeix_web.py
examenes/, documents oficials/   PDF originals
```

## Ús en local

```bash
python3 eines/construeix_web.py     # genera web/dades/
python3 eines/serveix_web.py        # obre http://localhost:8000
```

La web no funciona si s'obre `index.html` directament: cal un servidor.

## Actualitzar la base de dades

1. Modifica els exercicis de `base_dades/` o aplica les revisions exportades:
   `python3 eines/aplica_revisions.py revisions.json`
2. Valida: `python3 eines/comprova.py --tot`
3. Regenera les dades de la web: `python3 eines/construeix_web.py`

## Publicar la web

La web és una carpeta de fitxers estàtics (`web/`) i es pot allotjar en qualsevol servei gratuït de pàgines estàtiques. Google Sites no pot allotjar-la directament, però sí incrustar-la.

**Opció recomanada: GitHub Pages**
1. Crea un repositori a GitHub i puja-hi aquesta carpeta. GitHub Pages gratuït requereix que el repositori sigui públic.
2. A *Settings → Pages → Source*, tria **GitHub Actions**. El workflow `.github/workflows/publica-web.yml` regenera les dades i publica `web/` cada vegada que puges canvis.
3. La web queda a `https://<usuari>.github.io/<repositori>/`.

**Incrustar-la a Google Sites**: *Insereix → Insereix → Per URL*, enganxa-hi l'adreça i tria «Pàgina sencera». Dins d'un Google Site la web té menys espai i el navegador pot limitar les descàrregues. Per això la web mostra un enllaç «Obre en una pestanya nova ↗» quan està incrustada. També és recomanable posar-hi un botó que enllaci directament a l'adreça de la web.

## Llicències i crèdits

- Enunciats i pautes: PAU de Física, Generalitat de Catalunya (Departament de Recerca i Universitats).
- Motor LaTeX: [BusyTeX / texlyre-busytex](https://github.com/TeXlyre/texlyre-busytex) (AGPL-3.0) amb TeX Live 2026.
- Fórmules a la web: [MathJax](https://www.mathjax.org/). ZIP: [JSZip](https://stuk.github.io/jszip/).
