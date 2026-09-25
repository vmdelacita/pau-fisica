# Fase 5 — Versió per compartir amb altres centres: resum

**Data:** 2026-09-26 · **Estat:** acabada (pendent de publicar amb `git push`)
Resum anterior: `RESUM_FASE4.md` (solucions).

## Decisions del professor (abans de la fase)

1. **Dues adreces:**
   - L'adreça actual (`…/pau-fisica/`) passa a ser la **versió pública**, per compartir.
   - La del professor és **`…/pau-fisica/admin/`**: té el logo de l'institut, els valors per defecte de la capçalera i el **mode revisió**.
   - `?revisio` deixa de fer res.
2. **Bloc de la Generalitat** (escut i «Departament d'Educació i Formació Professional»): es manté a les dues versions.
3. **Logo pujat:** es desa al navegador i dins del projecte `.json`, i va dins de la carpeta .zip i del projecte d'Overleaf.
4. **Indicacions del logo en català.** Si no n'hi ha, la casella queda buida.
5. **Versió pública:** departament, trimestre i instruccions **en blanc**.
6. **Crèdits:** «Víctor Moreno» i una llicència Creative Commons no comercial.

## Què s'ha fet

### Versió pública (`/`)
- **Capçalera en blanc** (departament, trimestre, unitat i instruccions).
- **Sense el logo de l'institut.** Al seu lloc, un camp nou, **«Logo del centre (opcional)»**, amb:
  - una previsualització, el botó «Tria una imatge…» i l'enllaç «Treu el logo»;
  - aquest text d'ajuda: *«Surt a la dreta de la capçalera de l'examen, en una casella d'uns 2,3 × 2 cm. Format ideal: PNG o JPG, preferiblement amb fons transparent o blanc, de quadrat a apaïsat (fins a 3:2) i d'uns 600 px d'amplada. Si no n'hi poses cap, la casella queda buida.»*;
  - avisos si la imatge fa menys de 300 px d'amplada, és molt apaïsada (més de 1,6:1) o és més alta que ampla.
- **Com es tracta el logo pujat:**
  - Accepta qualsevol imatge que el navegador sàpiga llegir. La desa com a PNG, o com a JPG si l'original és JPG.
  - La redueix a 800 px d'amplada com a màxim. Així ocupa poc: 12–35 kB en les proves, fins i tot amb una imatge de 2000 px.
  - A la capçalera s'ajusta sense deformar-se a 2,3 cm d'amplada i 1,75 cm d'alçada com a màxim.
- **Sense pestanya Revisió**, encara que s'obri amb `?revisio`.
- **Peu de pàgina:** «Web creada per Víctor Moreno · CC BY-NC 4.0: es pot fer servir, copiar i adaptar lliurement sense finalitat lucrativa, citant-ne l'autor.». El peu surt a totes dues versions.

### Versió d'administració (`/admin/`)
- La mateixa pàgina, amb el títol «Exercicis PAU Física (admin)».
- Logo de l'institut (RCC.png), a la mateixa mida que abans, i els valors per defecte del centre.
- **Pestanya Revisió** sempre visible.
- Desa l'examen en curs i les revisions **per separat** de la versió pública. La primera vegada que s'obre, recupera el que hi havia a l'adreça pública: el teu examen en curs i les revisions que encara no hagis exportat.
- No té contrasenya: qui en conegui l'adreça la pot obrir. Tot el que s'hi fa, però, només afecta el navegador de qui la fa servir.

### Com funciona per dins
- `eines/construeix_web.py` genera `web/admin/index.html` a partir de `web/index.html`, i també ho fa el workflow de publicació. Només hi afegeix `<base href="../">`, perquè comparteixi tots els fitxers, i `window.PAU_VERSIO = 'admin'`. Està al `.gitignore` i no s'ha d'editar.
- A la plantilla `examen.tex`, el logo de la dreta és ara la macro `\logocentre{fitxer}`. Si és buida, la casella queda buida.

## Fitxers nous o modificats

```
web/plantilla/examen.tex   \logocentre en lloc de RCC.png fix
web/js/app.js              versió admin/pública, valors per defecte, logo pujat, migració de l'estat
web/js/examen.js           generaTex(..., logo)
web/index.html, estil.css  camp del logo, text de la pestanya Revisió, peu amb els crèdits
eines/construeix_web.py    genera web/admin/index.html
.gitignore                 web/admin/
README.md                  secció «Dues versions», revisió a /admin/, llicència
LICENSE.md                 NOU: CC BY-NC 4.0 i parts d'altres autors
```

## Proves fetes (Chrome headless)

- **Versió pública:**
  - La capçalera surt en blanc, no hi ha pestanya Revisió (tampoc amb `?revisio`) i hi ha el camp del logo i el peu.
  - Examen sense logo: la casella queda buida.
  - Logos de prova: quadrat (PNG), apaïsat (JPG), vertical (PNG) i gran (2000 px). Tots compilen, s'ajusten a la casella i mostren els avisos que toquen.
  - La carpeta .zip inclou `logo.png`.
  - «Treu el logo» funciona.
- **Versió d'administració:**
  - L'adreça es manté a `/admin/#…` quan es canvia de pestanya.
  - El logo RCC surt a la mateixa mida que abans, i la pestanya Revisió hi és.
  - Recupera l'examen i les revisions de l'adreça pública.
  - En un navegador net, carrega els valors per defecte del centre.
- Cap error a la consola.

## Què has de fer tu

- **Després de publicar, fes servir `…/pau-fisica/admin/`**, i afegeix-la a les adreces d'interès. A l'adreça pública ja no veuràs el logo ni la pestanya Revisió.
- Si tens la web incrustada al teu Google Site, decideix quina adreça vols que hi surti. L'alumnat no genera exàmens, així que probablement pot quedar la pública.
- Revisa el text de `LICENSE.md`. La llicència cobreix la web, les plantilles, els scripts i la classificació dels exercicis. Els enunciats i les pautes són de la Generalitat i no hi estan inclosos.

## Dubtes per a la fase següent

No n'hi ha cap de pendent. Possibles passos següents, si els vols:

1. Continuar la **revisió** dels exercicis a `/admin/`.
2. Recuperar els **exàmens antics** (lots 3 i 4), aparcats.
3. Permetre **imatges pròpies** als exercicis propis. Ara només es poden afegir amb la carpeta .zip o amb Overleaf.
