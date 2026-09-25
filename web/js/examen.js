// Composició del document LaTeX d'un examen o full d'exercicis.

// 1.25 -> "1,25"; 2.5 -> "2,5"; 1 -> "1"
export function formatPunts(x) {
  const r = Math.round(x * 100) / 100;
  return String(r).replace('.', ',');
}

export function llegeixPunts(t) {
  const x = parseFloat(String(t).replace(',', '.'));
  return Number.isFinite(x) ? x : 0;
}

const RE_APARTAT = /\\begin\{apartat\}\{([^}]*)\}[\s\S]*?\\end\{apartat\}/g;

// Punts de cada apartat d'un enunciat, en ordre.
export function apartatsDe(text) {
  return [...text.matchAll(RE_APARTAT)].map(m => ({ inclou: true, punts: llegeixPunts(m[1]) }));
}

// Aplica la selecció i els punts dels apartats al text de l'enunciat.
export function aplicaApartats(text, apartats, mostraPunts = true) {
  let k = 0;
  return text.replace(RE_APARTAT, (tot) => {
    const a = apartats[k++] || { inclou: true };
    if (!a.inclou) return '';
    const punts = mostraPunts && a.punts != null ? formatPunts(a.punts) : '';
    return tot.replace(/^\\begin\{apartat\}\{[^}]*\}/, `\\begin{apartat}{${punts}}`);
  }).replace(/\n{3,}/g, '\n\n');
}

// Sincronitza la llista d'apartats d'un element amb el seu text (si ha canviat el nombre).
export function sincronitzaApartats(item, text) {
  const nous = apartatsDe(text);
  if (!item.apartats || item.apartats.length !== nous.length) item.apartats = nous;
  return item.apartats;
}

export function puntsItem(item) {
  return (item.apartats || []).filter(a => a.inclou).reduce((s, a) => s + (a.punts || 0), 0);
}

// Prefix curt i únic per als fitxers de figures d'un exercici: 2026_ord_s1_E2
export function prefixFigures(id) {
  return id.split('_').slice(0, 4).join('_');
}

const RE_FIGURA = /(\\figura(?:\[[^\]]*\])?\{)([^}]+)\}/g;

export function figuresUsades(text) {
  return [...text.matchAll(RE_FIGURA)].map(m => m[2].trim());
}

function reanomenaFigures(text, prefix) {
  return text.replace(RE_FIGURA, (_, ini, nom) => `${ini}${prefix}_${nom.trim()}}`);
}

// Escapa els caràcters especials més habituals en un text pla (deixa $...$ per a fórmules).
export function escapaText(t) {
  return t.replace(/(?<!\\)([%&#])/g, '\\$1');
}

const CONVOCATORIA = { ordinaria: 'convocatòria ordinària', extraordinaria: 'convocatòria extraordinària' };
const MOSTRES = { optica: "exercicis de mostra d'òptica", 'moment-angular': 'exercicis de mostra de moment angular',
  experiments: "exemples de preguntes d'anàlisi d'experiments" };

// Descripció llegible de la procedència d'un exercici.
export function descriuFont(ex) {
  const f = ex.font;
  const num = `${f.tipus === 'mostra' ? (ex.id.split('_')[3] || '') : 'exercici ' + f.exercici + (f.opcio || '')}`;
  if (f.tipus === 'model') return `PAU ${f.any}, examen model, ${num}`;
  if (f.tipus === 'mostra') return `PAU ${f.any}, ${MOSTRES[f.serie] || 'mostra'}, ${num}`;
  return `PAU ${f.any}, ${CONVOCATORIA[f.convocatoria] || f.convocatoria}, sèrie ${f.serie}, ${ex.format === 'antic' ? 'problema ' + f.exercici + (f.opcio ? ', opció ' + f.opcio : '') : num}`;
}

function omple(plantilla, marca, text) {
  return plantilla.replace(new RegExp(`^%%${marca}%%$`, 'm'), () => text);
}

// Solució: \begin{solapartat} … \end{solapartat}, un per apartat i en el mateix ordre.
const RE_SOLAPARTAT = /\\begin\{solapartat\}[\s\S]*?\\end\{solapartat\}/g;
const RE_PUNTS = /\\punts\{([^}]*)\}/g;

export function nSolapartats(text) {
  return (text.match(RE_SOLAPARTAT) || []).length;
}

// Plantilla d'una solució en blanc amb n apartats.
export function plantillaSolucio(n) {
  return Array.from({ length: Math.max(1, n) }, () => '\\begin{solapartat}\n\n\\end{solapartat}').join('\n\n') + '\n';
}

// Una solució està buida si els apartats no tenen contingut (p. ex. la plantilla sense omplir).
export function solucioBuida(text) {
  return !String(text ?? '').replace(/^%.*$/gm, '').replace(/\\(begin|end)\{solapartat\}/g, '').trim();
}

// Solució que es fa servir per a un element de l'examen (null si no n'hi ha).
export function solucioItem(item, ex) {
  const t = item.solucio ?? ex?.solucio ?? null;
  return t == null || solucioBuida(t) ? null : t;
}

// Aplica la selecció d'apartats a la solució i reescala les puntuacions parcials (\punts{…})
// amb el mateix factor que el seu apartat: punts nous / punts originals de l'enunciat.
export function aplicaSolucio(text, apartats, puntsOriginals) {
  let k = 0;
  return text.replace(RE_SOLAPARTAT, (tot) => {
    const a = apartats[k];
    const orig = puntsOriginals[k++];
    if (a && !a.inclou) return '';
    if (!a || !(orig > 0) || a.punts == null || Math.abs(a.punts - orig) < 1e-9) return tot;
    const f = a.punts / orig;
    return tot.replace(RE_PUNTS, (_, x) => `\\punts{${formatPunts(llegeixPunts(x) * f)}}`);
  }).replace(/\n{3,}/g, '\n\n');
}

// examen: { tipus: 'examen'|'full', departament, trimestre, unitat, instruccions, procedencia,
//           enunciatsSolucions, items }
// exercicis: Map id -> exercici de la base de dades
// solucions: true per generar el solucionari (plantilla/solucions.tex)
// logo: nom del fitxer del logo del centre ('' si no n'hi ha)
// Retorna { tex, figures: [{ nom, url }] }
export function generaTex({ plantilla, preambul, examen, exercicis, urlFigura, solucions = false, logo = '' }) {
  const esExamen = examen.tipus === 'examen';
  const instruccions = (examen.instruccions || '').split('\n').map(l => l.trim()).filter(Boolean)
    .map(escapaText).join(' \\\\\n  ');
  const capcalera = [
    `\\departament{${escapaText(examen.departament || '')}}`,
    `\\trimestre{${escapaText(examen.trimestre || '')}}`,
    `\\unitat{${escapaText(examen.unitat || '')}}`,
    `\\instruccions{${instruccions ? '%\n  ' + instruccions + '}' : '}'}`,
    `\\logocentre{${logo}}`,
  ].join('\n');

  const figures = [];
  const blocs = examen.items.map(item => {
    const ex = item.id ? exercicis.get(item.id) : null;
    const text = item.text ?? ex?.enunciat ?? '';
    sincronitzaApartats(item, text);
    let cos = '';
    if (!solucions || examen.enunciatsSolucions) cos = aplicaApartats(text, item.apartats, esExamen).trim();
    if (solucions) {
      const sol = solucioItem(item, ex);
      const solCos = sol
        ? aplicaSolucio(sol, item.apartats, apartatsDe(text).map(a => a.punts)).trim()
        : '\\sensesolucio';
      cos = examen.enunciatsSolucions ? `${cos}\n\n\\titolsolucio\n${solCos}` : solCos;
    }
    if (ex) {
      const prefix = prefixFigures(ex.id);
      for (const nom of new Set(figuresUsades(cos))) {
        figures.push({ nom: `${prefix}_${nom}`, url: urlFigura(ex.id, nom) });
      }
      cos = reanomenaFigures(cos, prefix);
    }
    const punts = esExamen ? `[${formatPunts(puntsItem(item))}]` : '';
    const origen = ex ? ex.id : 'exercici propi';
    const proc = examen.procedencia && ex ? `\\procedencia{${descriuFont(ex)}}\n` : '';
    return `% ---- ${origen} ----\n\\begin{exercici}${punts}\n${proc}${cos}\n\\end{exercici}`;
  });

  let tex = plantilla;
  tex = omple(tex, 'PREAMBUL_EXERCICIS', preambul.trim() + '\n\\def\\exdir{figures}');
  tex = omple(tex, 'CAPCALERA', capcalera);
  tex = omple(tex, 'OPCIONS', esExamen ? '' : '\\mostrapuntsfalse');
  tex = omple(tex, 'EXERCICIS', blocs.join('\n\n'));
  return { tex, figures };
}
