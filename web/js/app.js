// Aplicació: cerca d'exercicis, composició d'exàmens i revisió de la base de dades.
import { latexAHtml, latexAText } from './latex_html.js';
import {
  generaTex, apartatsDe, sincronitzaApartats, puntsItem, formatPunts, llegeixPunts, descriuFont,
} from './examen.js';
import * as motor from './motor.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/·/g, '').toLowerCase();

const CLAU_ESTAT = 'pau-fisica/estat-v1';
const CLAU_MODE_REVISIO = 'pau-fisica/mode-revisio';
const INSTRUCCIONS_DEFECTE = [
  "Totes les respostes s'han de raonar i justificar. Un resultat erroni amb un raonament correcte es valora. Una resposta correcta sense raonament ni justificació pot ser valorada amb un 0.",
  "Un o més errors d'unitats o no posar-les (resultats intermedis i finals) en un problema es penalitzen amb un 20% del valor de l'exercici.",
  "Es permet l'ús de calculadora científica no programable.",
].join('\n');
const PLANTILLA_PROPI = `Enunciat de l'exercici.

\\begin{apartat}{1}
Primer apartat.
\\end{apartat}

\\begin{apartat}{1}
Segon apartat.
\\end{apartat}
`;
const CAMPS_REVISIO = ['revisat', 'dificultat', 'curriculum', 'bloc', 'subtemes', 'tipus', 'paraules_clau'];
const NOMS_FONT = { examen: 'Exàmens', model: 'Examen model', mostra: 'Mostres' };
const NOMS_FORMAT = { nou: 'Nou (2025+)', antic: 'Antic (≤2024)' };
const NOMS_CURRICULUM = { actual: 'Dins del currículum', parcial: 'Parcialment fora', antic: 'Fora del currículum' };
const DESC_CURRICULUM = {
  actual: 'Tots els apartats són dins del currículum actual (decret 171/2022).',
  parcial: 'Algun apartat queda fora del currículum actual (s\'explica a les notes).',
  antic: 'L\'exercici tracta temes que ja no són al currículum actual.',
};
const NOMS_ESTAT = { pendents: 'Sense revisar', revisats: 'Revisats per un humà', modificats: 'Amb canvis', dubtes: 'Amb dubtes' };

// ---------------------------------------------------------------- estat
let BASE = null;
const EX = new Map();          // id -> exercici original
const INDEX = new Map();       // id -> camps normalitzats per a la cerca
let BLOCS = [];
let estat = { examen: examenNou(), revisions: {} };
const filtres = { q: '', blocs: new Set(), subtema: '', dificultats: new Set(), tipus: new Set(), anys: new Set(), fonts: new Set(), formats: new Set(), curriculums: new Set(), estats: new Set(), ordre: 'rellevancia' };
let resultats = [];            // ids de l'última cerca
let detall = { id: null, llista: [], pestanya: 'enunciat' };
let ultimPdf = null;           // { tex, pdf, figures, nom }
let pdfDesactualitzat = false;
let compilant = false;

// Mode revisió (només per al professor): s'activa obrint la web amb ?revisio i el navegador
// ho recorda; ?revisio=0 el desactiva. Fora d'aquest mode no es veu la pestanya Revisió i
// tot (etiquetes, filtres, cerca) reflecteix només la base de dades publicada.
function llegeixModeRevisio() {
  const p = new URLSearchParams(location.search);
  const demanat = p.has('revisio') ? !['0', 'no'].includes(p.get('revisio')) : null;
  try {
    if (demanat === true) localStorage.setItem(CLAU_MODE_REVISIO, '1');
    if (demanat === false) localStorage.removeItem(CLAU_MODE_REVISIO);
    return localStorage.getItem(CLAU_MODE_REVISIO) === '1';
  } catch { return !!demanat; }
}
const modeRevisio = llegeixModeRevisio();

function examenNou(prev) {
  return {
    tipus: prev?.tipus ?? 'examen',
    departament: prev?.departament ?? 'Física 2n Batxillerat',
    trimestre: prev?.trimestre ?? '1r Trimestre',
    unitat: prev?.unitat ?? '',
    instruccions: prev?.instruccions ?? INSTRUCCIONS_DEFECTE,
    procedencia: prev?.procedencia ?? false,
    nomFitxer: prev?.nomFitxer ?? 'examen',
    items: [],
  };
}

function carregaEstat() {
  try {
    const s = JSON.parse(localStorage.getItem(CLAU_ESTAT) || 'null');
    if (s?.examen) estat.examen = { ...examenNou(), ...s.examen };
    if (s?.revisions) estat.revisions = s.revisions;
  } catch { /* sense emmagatzematge: es continua amb l'estat per defecte */ }
}

let temporitzadorDesa = null;
function desa() {
  clearTimeout(temporitzadorDesa);
  temporitzadorDesa = setTimeout(() => {
    try { localStorage.setItem(CLAU_ESTAT, JSON.stringify(estat)); } catch { /* ignora */ }
  }, 200);
}

// Exercici amb les revisions locals aplicades (només en mode revisió).
function ex(id) {
  const o = EX.get(id);
  const r = modeRevisio ? estat.revisions[id] : null;
  return r ? { ...o, ...r } : o;
}

const urlFigura = (id, nom) => `dades/fig/${encodeURIComponent(id)}/${encodeURIComponent(nom)}`;
const blocIdx = bloc => Math.max(0, BLOCS.indexOf(bloc));

function indexa(id) {
  const e = ex(id);
  INDEX.set(id, {
    titol: norm(e.titol),
    paraules: norm((e.paraules_clau || []).join(' | ')),
    subtemes: norm([...(e.subtemes || []), e.bloc].join(' | ')),
    resum: norm(e.resum),
    text: norm(latexAText(e.enunciat) + ' ' + latexAText(e.solucio) + ' ' + e.id),
  });
}

// ---------------------------------------------------------------- utilitats d'interfície
function avis(text, accio) {
  const el = $('#avis');
  el.innerHTML = `<span>${esc(text)}</span>`;
  if (accio) {
    const b = document.createElement('button');
    b.textContent = accio.text;
    b.onclick = () => { accio.fes(); el.hidden = true; };
    el.append(b);
  }
  el.hidden = false;
  clearTimeout(avis.t);
  avis.t = setTimeout(() => { el.hidden = true; }, accio ? 7000 : 3500);
}

async function tipografia(el) {
  const inici = Date.now();
  while (!window.MathJax?.typesetPromise) {
    if (Date.now() - inici > 15000) return;
    await new Promise(r => setTimeout(r, 100));
  }
  try {
    await window.MathJax.startup.promise;
    window.MathJax.typesetClear([el]);
    await window.MathJax.typesetPromise([el]);
  } catch (e) { console.warn('MathJax', e); }
}

function descarrega(nom, dades, tipus) {
  const url = URL.createObjectURL(dades instanceof Blob ? dades : new Blob([dades], { type: tipus }));
  const a = document.createElement('a');
  a.href = url; a.download = nom;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function llegeixFitxer(input) {
  return new Promise((resolve, reject) => {
    const f = input.files[0];
    if (!f) return reject(new Error('cap fitxer'));
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsText(f);
    input.value = '';
  });
}

function puntsDificultat(d) {
  return `<span class="dificultat" title="Dificultat ${d} de 5">${'●'.repeat(d)}<span class="buit">${'●'.repeat(5 - d)}</span></span>`;
}

// «Revisat per un humà»: segons la base de dades publicada. En mode revisió, les revisions
// locals encara no aplicades es mostren com a pendents.
function etiquetaRevisat(e) {
  const publicat = !!EX.get(e.id).revisat;
  if (e.revisat && publicat) return '<span class="etiqueta ok" title="Un professor ha revisat la transcripció i les metadades d\'aquest exercici">✓ Revisat per un humà</span>';
  if (e.revisat) return '<span class="etiqueta ok pendent" title="Revisió desada en aquest navegador; encara no s\'ha aplicat a la base de dades">✓ Revisat per un humà (pendent)</span>';
  if (publicat) return '<span class="etiqueta modificat" title="Revisió desmarcada en aquest navegador; encara no s\'ha aplicat a la base de dades">revisió desmarcada (pendent)</span>';
  return '';
}

const curriculum = e => e.curriculum || 'actual';
function etiquetaCurriculum(e) {
  const c = curriculum(e);
  if (c === 'actual') return '';
  const nota = e.notes ? `${DESC_CURRICULUM[c]}\n\n${e.notes}` : DESC_CURRICULUM[c];
  return `<span class="etiqueta fora" title="${esc(nota)}">${c === 'antic' ? 'Fora del currículum' : 'Parcialment fora del currículum'}</span>`;
}

function etiquetaCurta(e) {
  const f = e.font;
  const num = e.id.split('_')[3];
  if (f.tipus === 'model') return `Model ${f.any} · ${num}`;
  if (f.tipus === 'mostra') return `Mostra ${({ optica: 'òptica', 'moment-angular': 'moment angular', experiments: 'experiments' })[f.serie] || f.serie} · ${num}`;
  return `PAU ${f.any} · ${f.convocatoria === 'ordinaria' ? 'Ordinària' : 'Extraordinària'} S${f.serie} · ${num}`;
}

// Ressalta els termes de cerca (sense tenir en compte accents ni majúscules).
function ressalta(text, termes) {
  if (!termes.length) return esc(text);
  let n = '';
  const mapa = [];
  for (let i = 0; i < text.length; i++) {
    const c = norm(text[i]);
    for (const ch of c) { n += ch; mapa.push(i); }
  }
  const marca = new Array(text.length).fill(false);
  for (const t of termes) {
    let k = n.indexOf(t);
    while (k >= 0) {
      for (let j = k; j < k + t.length; j++) marca[mapa[j]] = true;
      k = n.indexOf(t, k + 1);
    }
  }
  let out = '', dins = false;
  for (let i = 0; i < text.length; i++) {
    if (marca[i] && !dins) { out += '<mark>'; dins = true; }
    if (!marca[i] && dins) { out += '</mark>'; dins = false; }
    out += esc(text[i]);
  }
  return out + (dins ? '</mark>' : '');
}

// ---------------------------------------------------------------- navegació
function mostraVista(v) {
  if (v === 'revisio' && !modeRevisio) v = 'cerca';
  for (const b of $$('.pestanyes [data-vista]')) b.setAttribute('aria-selected', String(b.dataset.vista === v));
  for (const s of $$('.vista')) s.hidden = s.id !== `vista-${v}`;
  if (location.hash !== `#${v}`) history.replaceState(null, '', `#${v}`);
  if (v === 'examen') { pintaExamen(); if (estat.examen.items.length) motor.prepara().catch(() => {}); }
  if (v === 'revisio') pintaRevisio();
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------- cerca
function xip(valor, text, seleccionat, n) {
  return `<button class="xip" data-valor="${esc(valor)}" aria-pressed="${seleccionat}">${esc(text)}${n != null ? `<span class="n">${n}</span>` : ''}</button>`;
}

function pintaFiltres() {
  const tots = [...EX.keys()].map(ex);
  const compta = f => tots.reduce((m, e) => { for (const v of [].concat(f(e))) m.set(v, (m.get(v) || 0) + 1); return m; }, new Map());
  const cBloc = compta(e => e.bloc), cDif = compta(e => e.dificultat), cTipus = compta(e => e.tipus || []),
    cAny = compta(e => e.font.any), cFont = compta(e => e.font.tipus), cFormat = compta(e => e.format), cCurr = compta(curriculum);

  $('#f-bloc').innerHTML = BLOCS.map((b, k) => xip(b, b, filtres.blocs.has(b), cBloc.get(b) || 0).replace('class="xip"', `class="xip b${k}"`)).join('');
  $('#f-dificultat').innerHTML = [1, 2, 3, 4, 5].map(d => xip(d, String(d), filtres.dificultats.has(String(d)), cDif.get(d) || 0)).join('');
  $('#f-tipus').innerHTML = BASE.taxonomia.tipus.map(t => xip(t, t, filtres.tipus.has(t), cTipus.get(t) || 0)).join('');
  $('#f-any').innerHTML = [...cAny.keys()].sort().map(a => xip(a, String(a), filtres.anys.has(String(a)), cAny.get(a))).join('');
  $('#f-font').innerHTML = Object.keys(NOMS_FONT).map(f => xip(f, NOMS_FONT[f], filtres.fonts.has(f), cFont.get(f) || 0)).join('');
  $('#f-format').innerHTML = Object.keys(NOMS_FORMAT).map(f => xip(f, NOMS_FORMAT[f], filtres.formats.has(f), cFormat.get(f) || 0)).join('');
  $('#f-curriculum').innerHTML = Object.keys(NOMS_CURRICULUM).map(f => xip(f, NOMS_CURRICULUM[f], filtres.curriculums.has(f), cCurr.get(f) || 0)).join('');
  $('#f-estat').innerHTML = Object.keys(NOMS_ESTAT).filter(f => modeRevisio || f !== 'modificats').map(f => xip(f, NOMS_ESTAT[f], filtres.estats.has(f))).join('');

  const sel = $('#f-subtema');
  const blocs = filtres.blocs.size ? BLOCS.filter(b => filtres.blocs.has(b)) : BLOCS;
  const cSub = compta(e => e.subtemes || []);
  sel.innerHTML = '<option value="">Tots els subtemes</option>' + blocs.map(b =>
    `<optgroup label="${esc(b)}">${BASE.taxonomia.blocs[b].map(s =>
      `<option value="${esc(s)}"${filtres.subtema === s ? ' selected' : ''}>${esc(s)} (${cSub.get(s) || 0})</option>`).join('')}</optgroup>`).join('');
  if (filtres.subtema && !blocs.some(b => BASE.taxonomia.blocs[b].includes(filtres.subtema))) filtres.subtema = '';
}

function teDubtes(e) { return (e.dubtes?.length || 0) > 0; }

function cerca() {
  const termes = norm(filtres.q).split(/\s+/).filter(Boolean);
  const pesos = { titol: 6, paraules: 4, subtemes: 3, resum: 2, text: 1 };
  const trobats = [];
  for (const id of EX.keys()) {
    const e = ex(id);
    if (filtres.blocs.size && !filtres.blocs.has(e.bloc) && !(e.blocs_secundaris || []).some(b => filtres.blocs.has(b))) continue;
    if (filtres.subtema && !(e.subtemes || []).includes(filtres.subtema)) continue;
    if (filtres.dificultats.size && !filtres.dificultats.has(String(e.dificultat))) continue;
    if (filtres.tipus.size && !(e.tipus || []).some(t => filtres.tipus.has(t))) continue;
    if (filtres.anys.size && !filtres.anys.has(String(e.font.any))) continue;
    if (filtres.fonts.size && !filtres.fonts.has(e.font.tipus)) continue;
    if (filtres.formats.size && !filtres.formats.has(e.format)) continue;
    if (filtres.curriculums.size && !filtres.curriculums.has(curriculum(e))) continue;
    if (filtres.estats.size) {
      const ok = [...filtres.estats].every(f =>
        f === 'pendents' ? !e.revisat : f === 'revisats' ? !!e.revisat
          : f === 'modificats' ? !!estat.revisions[id] : teDubtes(e));
      if (!ok) continue;
    }
    let punts = 0;
    if (termes.length) {
      const ix = INDEX.get(id);
      let totes = true;
      for (const t of termes) {
        let p = 0;
        for (const [camp, pes] of Object.entries(pesos)) if (ix[camp].includes(t)) p += pes;
        if (!p) { totes = false; break; }
        punts += p;
      }
      if (!totes) continue;
    }
    trobats.push({ id, punts, e });
  }
  const perAny = (a, b) => b.e.font.any - a.e.font.any || a.id.localeCompare(b.id);
  const ordres = {
    rellevancia: (a, b) => b.punts - a.punts || perAny(a, b),
    'any-desc': perAny,
    'any-asc': (a, b) => a.e.font.any - b.e.font.any || a.id.localeCompare(b.id),
    'dif-asc': (a, b) => a.e.dificultat - b.e.dificultat || perAny(a, b),
    'dif-desc': (a, b) => b.e.dificultat - a.e.dificultat || perAny(a, b),
  };
  trobats.sort(ordres[filtres.ordre] || ordres.rellevancia);
  resultats = trobats.map(t => t.id);
  pintaResultats(trobats.map(t => t.e), termes);
}

function idsExamen() { return new Set(estat.examen.items.map(i => i.id).filter(Boolean)); }

function botoAfegeix(id, enExamen, gran = false) {
  return enExamen
    ? `<button class="boto ${gran ? '' : 'petit'} afegit" data-afegeix="${esc(id)}" title="Treu-lo de l'examen">✓ A l'examen</button>`
    : `<button class="boto ${gran ? 'primari' : 'petit secundari'}" data-afegeix="${esc(id)}">+ Afegeix a l'examen</button>`;
}

function pintaResultats(llista, termes) {
  const n = llista.length;
  $('#n-resultats').textContent = `${n} ${n === 1 ? 'exercici' : 'exercicis'}`;
  if (!n) {
    $('#llista').innerHTML = '<div class="sense-resultats">Cap exercici no coincideix amb la cerca. Prova amb menys filtres o amb altres paraules.</div>';
    return;
  }
  const alExamen = idsExamen();
  $('#llista').innerHTML = llista.map(e => `
    <article class="targeta b${blocIdx(e.bloc)}" data-id="${esc(e.id)}" tabindex="0">
      <div>
        <h3>${ressalta(e.titol, termes)}</h3>
        <div class="meta"><span>${esc(etiquetaCurta(e))}</span>${puntsDificultat(e.dificultat)}<span>${formatPunts(e.punts_total)} punts · ${e.apartats.length} apartats</span></div>
      </div>
      <div class="accions">${botoAfegeix(e.id, alExamen.has(e.id))}</div>
      <p class="resum">${ressalta(e.resum || '', termes)}</p>
      <div class="subtemes">
        <span class="etiqueta bloc">${esc(e.bloc)}</span>
        ${(e.subtemes || []).map(s => `<span class="etiqueta">${esc(s)}</span>`).join('')}
        ${e.format === 'antic' ? '<span class="etiqueta antic">format antic</span>' : ''}
        ${etiquetaCurriculum(e)}
        ${etiquetaRevisat(e)}
        ${teDubtes(e) ? `<span class="etiqueta avis" title="La pauta original pot tenir errors">${e.dubtes.length} ${e.dubtes.length === 1 ? 'dubte' : 'dubtes'}</span>` : ''}
        ${modeRevisio && estat.revisions[e.id] ? '<span class="etiqueta modificat">amb canvis</span>' : ''}
      </div>
    </article>`).join('');
}

function commutaExamen(id) {
  const items = estat.examen.items;
  const k = items.findIndex(i => i.id === id);
  if (k >= 0) {
    const [tret] = items.splice(k, 1);
    avis('Exercici tret de l\'examen', { text: 'Desfés', fes: () => { items.splice(k, 0, tret); canviExamen(); } });
  } else {
    const e = EX.get(id);
    items.push({ uid: crypto.randomUUID(), id, text: null, apartats: apartatsDe(e.enunciat) });
    avis(`Afegit a l'examen (${items.length} ${items.length === 1 ? 'exercici' : 'exercicis'})`);
  }
  canviExamen();
}

function marcaDesactualitzat() {
  pdfDesactualitzat = true;
  if (ultimPdf && !compilant) estatMotor('Hi ha canvis que encara no són al PDF: torna a prémer «Genera el PDF».');
}

function canviExamen() {
  marcaDesactualitzat();
  desa();
  $('#n-examen').textContent = estat.examen.items.length;
  const alExamen = idsExamen();
  for (const b of $$('[data-afegeix]')) {
    const id = b.dataset.afegeix;
    b.outerHTML = botoAfegeix(id, alExamen.has(id), b.closest('.peu-dialeg') != null);
  }
  if (!$('#vista-examen').hidden) pintaExamen();
}

// ---------------------------------------------------------------- detall
function obreDetall(id, llista = resultats, pestanya = null) {
  detall = { id, llista: llista.includes(id) ? llista : [id], pestanya: pestanya || detall.pestanya || 'enunciat' };
  if (detall.pestanya === 'revisio' && !modeRevisio) detall.pestanya = 'enunciat';
  const d = $('#detall');
  if (!d.open) d.showModal();
  pintaDetall();
}

function pintaDetall() {
  const e = ex(detall.id);
  const k = detall.llista.indexOf(detall.id);
  $('#d-titol').textContent = e.titol;
  $('#d-sub').textContent = `${descriuFont(e)} · ${e.id}`;
  $('#d-anterior').disabled = k <= 0;
  $('#d-seguent').disabled = k < 0 || k >= detall.llista.length - 1;
  for (const b of $$('#detall [data-pestanya]')) b.setAttribute('aria-selected', String(b.dataset.pestanya === detall.pestanya));
  const f = e.font;
  const enllac = (pdf, pags, text) => pdf ? `<a href="dades/originals/${esc(pdf.split('/').pop())}#page=${pags?.[0] || 1}" target="_blank" rel="noopener">${text}</a>` : '';
  $('#d-originals').innerHTML = [enllac(f.pdf_enunciat, f.pagines_enunciat, 'PDF original'), enllac(f.pdf_solucio, f.pagines_solucio, 'Pauta original')].filter(Boolean).join('');
  $('#d-etiquetes').innerHTML = `<span class="etiqueta bloc b${blocIdx(e.bloc)}">${esc(e.bloc)}</span>${puntsDificultat(e.dificultat)}
    ${etiquetaRevisat(e)}${e.format === 'antic' ? '<span class="etiqueta antic">format antic</span>' : ''}${etiquetaCurriculum(e)}`;
  $('#detall .peu-dialeg [data-afegeix]')?.remove();
  $('#d-afegeix').outerHTML = `<span id="d-afegeix">${botoAfegeix(e.id, idsExamen().has(e.id), true)}</span>`;

  const cos = $('#d-cos');
  cos.scrollTop = 0;
  const fig = nom => urlFigura(e.id, nom);
  if (detall.pestanya === 'enunciat') {
    cos.innerHTML = `<div class="ex-html">${latexAHtml(e.enunciat, { figura: fig })}</div>`;
    tipografia(cos);
  } else if (detall.pestanya === 'solucio') {
    const dubtes = teDubtes(e) ? `<div class="dubtes"><strong>Possibles errors a la pauta original</strong> (transcrits tal com són):<ul>${e.dubtes.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
    const noOficial = e.solucio_oficial === false ? '<div class="dubtes">Aquest exercici no té solució oficial.</div>' : '';
    cos.innerHTML = `${dubtes}${noOficial}<div class="ex-html">${latexAHtml(e.solucio, { figura: fig })}</div>`;
    tipografia(cos);
  } else {
    pintaFormulariRevisio(cos, e);
  }
}

function pintaFormulariRevisio(cos, e) {
  const o = EX.get(e.id);
  const tax = BASE.taxonomia;
  const rev = estat.revisions[e.id] || {};
  const original = (camp, text) => estat.revisions[e.id]?.[camp] !== undefined ? `<div class="original">Original: ${esc(text)}</div>` : '';
  cos.innerHTML = `
    <form class="revisio-form" autocomplete="off">
      ${teDubtes(e) ? `<div class="dubtes"><strong>Dubtes de la transcripció:</strong><ul>${e.dubtes.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      <div class="fila"><div class="etq">Estat</div>
        <label class="check"><input type="checkbox" name="revisat" ${e.revisat ? 'checked' : ''}> Marcat com a revisat</label></div>
      <div class="fila"><div class="etq">Dificultat</div><div>
        <div class="escala">${[1, 2, 3, 4, 5].map(d => `<button type="button" class="xip" data-dificultat="${d}" aria-pressed="${e.dificultat === d}">${d}</button>`).join('')}</div>
        <div class="rubrica">${esc(tax.dificultat[e.dificultat])}</div>
        <div class="original">Justificació original (${o.dificultat}): ${esc(o.justificacio_dificultat || '')}</div></div></div>
      <div class="fila"><div class="etq">Currículum</div><div>
        <select name="curriculum">${Object.keys(NOMS_CURRICULUM).map(c => `<option value="${c}"${c === curriculum(e) ? ' selected' : ''}>${esc(NOMS_CURRICULUM[c])}</option>`).join('')}</select>
        <div class="rubrica">${esc(DESC_CURRICULUM[curriculum(e)])}${curriculum(e) !== 'actual' ? ' Explica-ho al comentari.' : ''}</div>
        ${original('curriculum', NOMS_CURRICULUM[curriculum(o)])}</div></div>
      <div class="fila"><div class="etq">Bloc</div><div>
        <select name="bloc">${BLOCS.map(b => `<option${b === e.bloc ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select>
        ${original('bloc', o.bloc)}</div></div>
      <div class="fila"><div class="etq">Subtemes</div><div class="caselles">
        ${BLOCS.map(b => `<div class="grup">${esc(b)}</div>` + tax.blocs[b].map(s =>
          `<label><input type="checkbox" name="subtemes" value="${esc(s)}" ${(e.subtemes || []).includes(s) ? 'checked' : ''}> ${esc(s)}</label>`).join('')).join('')}
        </div></div>
      <div class="fila"><div class="etq">Tipus de tasca</div><div class="caselles">
        ${tax.tipus.map(t => `<label><input type="checkbox" name="tipus" value="${esc(t)}" ${(e.tipus || []).includes(t) ? 'checked' : ''}> ${esc(t)}</label>`).join('')}
        </div></div>
      <div class="fila"><div class="etq">Paraules clau</div><div>
        <input type="text" name="paraules_clau" value="${esc((e.paraules_clau || []).join(', '))}">
        <div class="original">Separades per comes.</div>${original('paraules_clau', (o.paraules_clau || []).join(', '))}</div></div>
      <div class="fila"><div class="etq">Comentari</div><div>
        <textarea name="comentari" rows="3" placeholder="Errors trobats, coses a corregir…">${esc(rev.comentari || '')}</textarea></div></div>
      ${o.notes ? `<div class="fila"><div class="etq">Notes de la transcripció</div><div class="metadades-originals">${esc(o.notes)}</div></div>` : ''}
      <div class="fila"><div></div><div><button type="button" class="boto perill" data-desfes ${estat.revisions[e.id] ? '' : 'disabled'}>Desfés els canvis d'aquest exercici</button></div></div>
    </form>`;
}

function desaRevisio(id, camp, valor) {
  const o = EX.get(id);
  const r = estat.revisions[id] || {};
  if (camp === 'comentari') {
    if (valor.trim()) r.comentari = valor; else delete r.comentari;
  } else if (JSON.stringify(valor) === JSON.stringify(camp === 'revisat' ? !!o.revisat : o[camp])) {
    delete r[camp];
  } else {
    r[camp] = valor;
  }
  if (Object.keys(r).length) estat.revisions[id] = r; else delete estat.revisions[id];
  indexa(id);
  desa();
  pintaComptadorRevisio();
}

// ---------------------------------------------------------------- examen
function pintaExamen() {
  const ex_ = estat.examen;
  for (const b of $$('.segmentat [data-tipus]')) b.setAttribute('aria-pressed', String(b.dataset.tipus === ex_.tipus));
  $('#ajuda-tipus').textContent = ex_.tipus === 'examen'
    ? 'Es mostren els punts de cada exercici i de cada apartat.'
    : 'Mateix format que l\'examen, però sense puntuacions.';
  const camps = { '#e-departament': 'departament', '#e-trimestre': 'trimestre', '#e-unitat': 'unitat', '#e-instruccions': 'instruccions', '#e-nom': 'nomFitxer' };
  for (const [sel, camp] of Object.entries(camps)) if (document.activeElement !== $(sel)) $(sel).value = ex_[camp] ?? '';
  $('#e-procedencia').checked = !!ex_.procedencia;
  $('#reescala-caixa').hidden = ex_.tipus !== 'examen';
  pintaItems();
}

function pintaItems() {
  const ex_ = estat.examen;
  const esExamen = ex_.tipus === 'examen';
  const cont = $('#items');
  if (!ex_.items.length) {
    cont.innerHTML = '<div class="items-buit">Encara no hi ha cap exercici. Afegeix-ne des de <a href="#cerca" data-vista-enllac="cerca">Cerca</a>.</div>';
  } else {
    cont.innerHTML = ex_.items.map((item, k) => {
      const e = item.id ? ex(item.id) : null;
      const text = item.text ?? e?.enunciat ?? '';
      const aps = sincronitzaApartats(item, text);
      const titol = e ? e.titol : (item.titol || 'Exercici propi');
      const controls = aps.map((a, j) => `
        <span class="apartat-ctl${a.inclou ? '' : ' exclos'}">
          <label><input type="checkbox" data-inclou="${j}" ${a.inclou ? 'checked' : ''}> ${String.fromCharCode(97 + j)})</label>
          ${esExamen ? `<input type="number" min="0" step="0.25" data-punts="${j}" value="${a.punts}" aria-label="Punts de l'apartat ${String.fromCharCode(97 + j)}" ${a.inclou ? '' : 'disabled'}>` : ''}
        </span>`).join('');
      return `
      <div class="item b${e ? blocIdx(e.bloc) : 'x'}" data-uid="${item.uid}">
        <div class="num">${k + 1}.</div>
        <div>
          <div class="titol"><button data-accio="${e ? 'detall' : 'edita'}">${esc(titol)}</button>
            ${item.text != null ? ' <span class="etiqueta modificat">editat</span>' : ''}</div>
          <div class="origen">${e ? esc(etiquetaCurta(e)) + ' · ' + puntsDificultat(e.dificultat) : 'Exercici propi'}</div>
        </div>
        <div class="botons">
          <button class="boto-icona" data-accio="amunt" title="Puja" aria-label="Puja" ${k === 0 ? 'disabled' : ''}>↑</button>
          <button class="boto-icona" data-accio="avall" title="Baixa" aria-label="Baixa" ${k === ex_.items.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="boto-icona" data-accio="edita" title="Edita el LaTeX" aria-label="Edita">✎</button>
          <button class="boto-icona" data-accio="treu" title="Treu de l'examen" aria-label="Treu">✕</button>
        </div>
        <div class="apartats">${controls || '<span class="suau">Sense apartats</span>'}
          ${esExamen ? `<span class="suau">= ${formatPunts(puntsItem(item))} punts</span>` : ''}</div>
      </div>`;
    }).join('');
  }
  const total = ex_.items.reduce((s, i) => s + puntsItem(i), 0);
  const t = $('#total-punts');
  t.textContent = esExamen && ex_.items.length ? `Total: ${formatPunts(total)} punts` : '';
  t.classList.toggle('avis', esExamen && ex_.items.length > 0 && Math.abs(total - 10) > 1e-9);
  t.title = t.classList.contains('avis') ? 'El total no és 10 punts' : '';
  $('#n-examen').textContent = ex_.items.length;
  $('#genera-pdf').disabled = !ex_.items.length;
}

function reescala(objectiu) {
  const items = estat.examen.items;
  const aps = items.flatMap(i => i.apartats.filter(a => a.inclou));
  const total = aps.reduce((s, a) => s + a.punts, 0);
  if (!total || !(objectiu > 0)) return;
  const f = objectiu / total;
  for (const a of aps) a.punts = Math.round(a.punts * f * 4) / 4;
  const dif = objectiu - aps.reduce((s, a) => s + a.punts, 0);
  if (Math.abs(dif) > 1e-9) {
    const gran = aps.reduce((m, a) => (a.punts > m.punts ? a : m), aps[0]);
    gran.punts = Math.round((gran.punts + dif) * 100) / 100;
  }
  canviExamen();
}

// ---------------------------------------------------------------- editor
let editant = null;
function obreEditor(uid) {
  const item = estat.examen.items.find(i => i.uid === uid);
  if (!item) return;
  editant = item;
  const original = item.id ? EX.get(item.id).enunciat : PLANTILLA_PROPI;
  $('#ed-text').value = item.text ?? original;
  $('#ed-restaura').hidden = !item.id;
  $('#editor').showModal();
  previEditor();
}

let temporitzadorPrevi = null;
function previEditor() {
  clearTimeout(temporitzadorPrevi);
  temporitzadorPrevi = setTimeout(() => {
    const el = $('#ed-previ');
    const id = editant?.id;
    el.innerHTML = latexAHtml($('#ed-text').value, { figura: nom => id ? urlFigura(id, nom) : nom });
    tipografia(el);
  }, 250);
}

function desaEditor() {
  const item = editant;
  const text = $('#ed-text').value;
  const original = item.id ? EX.get(item.id).enunciat : null;
  // Es conserven la selecció i els punts de cada apartat, excepte si s'han canviat al text.
  const anteriors = item.apartats || [];
  const abans = apartatsDe(item.text ?? original ?? '');
  item.text = text === original ? null : text;
  item.apartats = apartatsDe(text).map((a, k) => ({
    inclou: anteriors[k]?.inclou ?? true,
    punts: anteriors[k] && abans[k]?.punts === a.punts ? anteriors[k].punts : a.punts,
  }));
  $('#editor').close();
  canviExamen();
}

// ---------------------------------------------------------------- generació del PDF
const memoria = new Map();
async function bytes(url) {
  if (!memoria.has(url)) {
    memoria.set(url, fetch(url).then(r => {
      if (!r.ok) throw new Error(`No s'ha pogut carregar ${url}`);
      return r.arrayBuffer();
    }).then(b => new Uint8Array(b)).catch(e => { memoria.delete(url); throw e; }));
  }
  return memoria.get(url);
}
async function text(url) { return new TextDecoder().decode(await bytes(url)); }

function nomFitxer() {
  const n = (estat.examen.nomFitxer || 'examen').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return n || 'examen';
}

function estatMotor(html, error = false) {
  const el = $('#estat-motor');
  el.innerHTML = html;
  el.classList.toggle('error', error);
}

async function generaPdf() {
  const examen = estat.examen;
  if (!examen.items.length) return;
  const boto = $('#genera-pdf');
  boto.disabled = true;
  compilant = true;
  $('#errors-latex').hidden = true;
  const inici = performance.now();
  try {
    const [plantilla, preambul] = await Promise.all([text('plantilla/examen.tex'), text('plantilla/preambul_exercicis.tex')]);
    const { tex, figures } = generaTex({ plantilla, preambul, examen, exercicis: new Map([...EX.keys()].map(id => [id, EX.get(id)])), urlFigura });
    const fitxers = [
      { path: 'senyal_bn.png', content: await bytes('plantilla/senyal_bn.png') },
      { path: 'RCC.png', content: await bytes('plantilla/RCC.png') },
    ];
    const vistes = new Set();
    for (const f of figures) {
      if (vistes.has(f.nom)) continue;
      vistes.add(f.nom);
      fitxers.push({ path: `figures/${f.nom}`, content: await bytes(f.url) });
    }
    if (!motor.estaPreparat()) {
      estatMotor('<span class="spinner"></span>Preparant el motor LaTeX… (la primera vegada es descarreguen uns 48 MB)');
    } else {
      estatMotor('<span class="spinner"></span>Compilant…');
    }
    await motor.prepara();
    estatMotor('<span class="spinner"></span>Compilant…');
    const r = await motor.compila(tex, fitxers);
    const segons = ((performance.now() - inici) / 1000).toFixed(1).replace('.', ',');
    ultimPdf = { tex, pdf: r.ok ? r.pdf : null, fitxers, nom: nomFitxer() };
    pdfDesactualitzat = false;
    $('#descarregues').hidden = false;
    $('#baixa-pdf').hidden = !r.ok;
    if (!r.ok) {
      estatMotor(`No s'ha pogut compilar el document (${r.errors.length || 1} ${r.errors.length === 1 ? 'error' : 'errors'}). Pots descarregar el .tex o obrir-lo a Overleaf per corregir-lo.`, true);
      mostraErrors(r.errors, tex, r.log);
      return;
    }
    const url = URL.createObjectURL(new Blob([r.pdf], { type: 'application/pdf' }));
    const visor = $('#visor');
    const anterior = visor.querySelector('iframe')?.src;
    visor.innerHTML = `<iframe title="PDF generat" src="${url}"></iframe>`;
    if (anterior?.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(anterior), 5000);
    estatMotor(`PDF generat en ${segons} s.`);
  } catch (e) {
    console.error(e);
    estatMotor(`Error: ${esc(e.message || e)}`, true);
  } finally {
    compilant = false;
    boto.disabled = !examen.items.length;
  }
}

function mostraErrors(errors, tex, log) {
  const linies = tex.split('\n');
  const exerciciDe = linia => {
    let n = 0, id = null;
    for (let i = 0; i < Math.min(linia, linies.length); i++) {
      const m = /^% ---- (.+) ----$/.exec(linies[i]);
      if (m) { n++; id = m[1]; }
    }
    return n ? `a l'exercici ${n}${id && EX.has(id) ? ` («${EX.get(id).titol}»)` : ''}` : 'a la capçalera o la plantilla';
  };
  const el = $('#errors-latex');
  el.innerHTML = (errors.length ? errors : [{ missatge: 'Error desconegut', linia: null, context: '' }]).slice(0, 5).map(er =>
    `<div><strong>${esc(er.missatge)}</strong> ${er.linia ? `— línia ${er.linia}, ${esc(exerciciDe(er.linia))}` : ''}
     ${er.explicacio ? `<div>${esc(er.explicacio)}</div>` : ''}
     ${er.context ? `<pre>${esc(er.context)}</pre>` : ''}</div>`).join('') +
    `<details><summary>Registre complet de LaTeX</summary><pre>${esc(log.slice(-8000))}</pre></details>`;
  el.hidden = false;
}

async function zip({ ambPdf, carpeta }) {
  if (!window.JSZip) throw new Error('No s\'ha pogut carregar la biblioteca de ZIP.');
  const z = new window.JSZip();
  const p = carpeta ? `${ultimPdf.nom}/` : '';
  z.file(`${p}${ultimPdf.nom}.tex`, ultimPdf.tex);
  if (ambPdf && ultimPdf.pdf) z.file(`${p}${ultimPdf.nom}.pdf`, ultimPdf.pdf);
  for (const f of ultimPdf.fitxers) z.file(`${p}${f.path}`, f.content);
  return z;
}

async function obreOverleaf() {
  const z = await zip({ ambPdf: false, carpeta: false });
  const b64 = await z.generateAsync({ type: 'base64' });
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://www.overleaf.com/docs';
  form.target = '_blank';
  for (const [k, v] of Object.entries({ snip_uri: `data:application/zip;base64,${b64}`, engine: 'pdflatex', main_document: `${ultimPdf.nom}.tex`, snip_name: ultimPdf.nom })) {
    const i = document.createElement('input');
    i.type = 'hidden'; i.name = k; i.value = v;
    form.append(i);
  }
  document.body.append(form);
  form.submit();
  form.remove();
}

// ---------------------------------------------------------------- revisió
function pintaComptadorRevisio() {
  const n = [...EX.keys()].filter(id => ex(id).revisat).length;
  $('#n-revisio').textContent = `${n}/${EX.size}`;
}

let filtreRevisio = 'tots';
function pintaRevisio() {
  const ids = [...EX.keys()];
  const nRev = ids.filter(id => ex(id).revisat).length;
  $('#progres-barra').style.width = `${(100 * nRev / ids.length).toFixed(1)}%`;
  const nCanvis = Object.keys(estat.revisions).length;
  $('#progres-text').textContent = `${nRev} de ${ids.length} exercicis revisats · ${nCanvis} amb canvis per exportar`;
  const opcions = { tots: 'Tots', pendents: 'Pendents', revisats: 'Revisats', modificats: 'Amb canvis', dubtes: 'Amb dubtes' };
  $('#r-filtre').innerHTML = Object.entries(opcions).map(([k, v]) => xip(k, v, filtreRevisio === k)).join('');
  const files = ids.map(ex).filter(e =>
    filtreRevisio === 'tots' || (filtreRevisio === 'pendents' && !e.revisat) || (filtreRevisio === 'revisats' && e.revisat)
    || (filtreRevisio === 'modificats' && estat.revisions[e.id]) || (filtreRevisio === 'dubtes' && teDubtes(e)));
  $('#taula-revisio').dataset.ids = JSON.stringify(files.map(e => e.id));
  $('#taula-revisio').innerHTML = `<thead><tr><th>Exercici</th><th>Bloc</th><th>Dificultat</th><th>Estat</th><th>Dubtes</th><th>Comentari</th></tr></thead><tbody>` +
    files.map(e => {
      const o = EX.get(e.id);
      const dif = e.dificultat !== o.dificultat ? `${o.dificultat} → <strong>${e.dificultat}</strong>` : e.dificultat;
      return `<tr class="clicable" data-id="${esc(e.id)}">
        <td><div>${esc(e.titol)}</div><div class="suau" style="font-size:.8rem">${esc(etiquetaCurta(e))}</div></td>
        <td><span class="etiqueta bloc b${blocIdx(e.bloc)}">${esc(e.bloc)}</span></td>
        <td>${dif}</td>
        <td>${e.revisat ? '<span class="etiqueta ok">✓ revisat</span>' : '<span class="suau">pendent</span>'}${estat.revisions[e.id] ? ' <span class="etiqueta modificat">canvis</span>' : ''}</td>
        <td>${teDubtes(e) ? `<span class="etiqueta avis">${e.dubtes.length}</span>` : ''}</td>
        <td class="suau">${esc(estat.revisions[e.id]?.comentari || '')}</td></tr>`;
    }).join('') + '</tbody>';
}

// ---------------------------------------------------------------- esdeveniments
function connecta() {
  // Pestanyes principals
  for (const b of $$('.pestanyes [data-vista]')) b.onclick = () => mostraVista(b.dataset.vista);
  for (const el of $$('[data-mode-revisio]')) el.hidden = !modeRevisio;
  document.addEventListener('click', ev => {
    const a = ev.target.closest('[data-vista-enllac]');
    if (a) { ev.preventDefault(); mostraVista(a.dataset.vistaEnllac); }
  });

  // Filtres
  let temporitzadorQ = null;
  $('#q').addEventListener('input', () => {
    clearTimeout(temporitzadorQ);
    temporitzadorQ = setTimeout(() => { filtres.q = $('#q').value; cerca(); }, 120);
  });
  const conjunts = { '#f-bloc': 'blocs', '#f-dificultat': 'dificultats', '#f-tipus': 'tipus', '#f-any': 'anys', '#f-font': 'fonts', '#f-format': 'formats', '#f-curriculum': 'curriculums', '#f-estat': 'estats' };
  for (const [sel, clau] of Object.entries(conjunts)) {
    $(sel).addEventListener('click', ev => {
      const b = ev.target.closest('.xip');
      if (!b) return;
      const s = filtres[clau];
      s.has(b.dataset.valor) ? s.delete(b.dataset.valor) : s.add(b.dataset.valor);
      pintaFiltres(); cerca();
    });
  }
  $('#f-subtema').onchange = ev => { filtres.subtema = ev.target.value; cerca(); };
  $('#ordre').onchange = ev => { filtres.ordre = ev.target.value; cerca(); };
  $('#neteja-filtres').onclick = () => {
    filtres.q = ''; filtres.subtema = '';
    for (const k of ['blocs', 'dificultats', 'tipus', 'anys', 'fonts', 'formats', 'curriculums', 'estats']) filtres[k].clear();
    $('#q').value = '';
    pintaFiltres(); cerca();
  };
  $('#mostra-filtres').onclick = () => $('#filtres').classList.toggle('obert');

  // Resultats
  $('#llista').addEventListener('click', ev => {
    const b = ev.target.closest('[data-afegeix]');
    if (b) { ev.stopPropagation(); commutaExamen(b.dataset.afegeix); return; }
    const t = ev.target.closest('.targeta');
    if (t) obreDetall(t.dataset.id, resultats);
  });
  $('#llista').addEventListener('keydown', ev => {
    const t = ev.target.closest('.targeta');
    if (t && ev.key === 'Enter') obreDetall(t.dataset.id, resultats);
  });

  // Diàlegs
  for (const b of $$('[data-tanca]')) b.onclick = () => b.closest('dialog').close();
  for (const d of $$('dialog')) d.addEventListener('click', ev => { if (ev.target === d) d.close(); });
  $('#detall').addEventListener('close', () => { cerca(); if (!$('#vista-revisio').hidden) pintaRevisio(); if (!$('#vista-examen').hidden) pintaExamen(); });
  for (const b of $$('#detall [data-pestanya]')) b.onclick = () => { detall.pestanya = b.dataset.pestanya; pintaDetall(); };
  const mou = pas => {
    const k = detall.llista.indexOf(detall.id) + pas;
    if (k >= 0 && k < detall.llista.length) { detall.id = detall.llista[k]; pintaDetall(); }
  };
  $('#d-anterior').onclick = () => mou(-1);
  $('#d-seguent').onclick = () => mou(1);
  $('#detall').addEventListener('keydown', ev => {
    if (ev.target.matches('input, textarea, select')) return;
    if (ev.key === 'ArrowLeft') mou(-1);
    if (ev.key === 'ArrowRight') mou(1);
  });
  $('#detall').addEventListener('click', ev => {
    const b = ev.target.closest('[data-afegeix]');
    if (b) commutaExamen(b.dataset.afegeix);
  });

  // Formulari de revisió (dins del detall)
  const cos = $('#d-cos');
  cos.addEventListener('change', ev => {
    const form = ev.target.closest('.revisio-form');
    if (!form) return;
    const id = detall.id;
    const n = ev.target.name;
    if (n === 'revisat') desaRevisio(id, 'revisat', ev.target.checked);
    else if (n === 'bloc') desaRevisio(id, 'bloc', ev.target.value);
    else if (n === 'curriculum') { desaRevisio(id, 'curriculum', ev.target.value); pintaDetall(); }
    else if (n === 'subtemes' || n === 'tipus') {
      const ordre = n === 'subtemes' ? BLOCS.flatMap(b => BASE.taxonomia.blocs[b]) : BASE.taxonomia.tipus;
      const marcats = $$(`input[name="${n}"]:checked`, form).map(i => i.value);
      desaRevisio(id, n, ordre.filter(x => marcats.includes(x)));
    } else if (n === 'paraules_clau') {
      desaRevisio(id, 'paraules_clau', ev.target.value.split(',').map(s => s.trim()).filter(Boolean));
    } else if (n === 'comentari') {
      desaRevisio(id, 'comentari', ev.target.value);
    }
    pintaDetall();
  });
  cos.addEventListener('click', ev => {
    const d = ev.target.closest('[data-dificultat]');
    if (d) { desaRevisio(detall.id, 'dificultat', +d.dataset.dificultat); pintaDetall(); return; }
    if (ev.target.closest('[data-desfes]')) {
      const anterior = estat.revisions[detall.id];
      delete estat.revisions[detall.id];
      indexa(detall.id); desa(); pintaComptadorRevisio(); pintaDetall();
      avis('Canvis desfets', { text: 'Recupera', fes: () => { estat.revisions[detall.id] = anterior; indexa(detall.id); desa(); pintaComptadorRevisio(); pintaDetall(); } });
    }
  });

  // Examen: dades de la capçalera
  for (const b of $$('.segmentat [data-tipus]')) b.onclick = () => { estat.examen.tipus = b.dataset.tipus; canviExamen(); };
  const camps = { '#e-departament': 'departament', '#e-trimestre': 'trimestre', '#e-unitat': 'unitat', '#e-instruccions': 'instruccions', '#e-nom': 'nomFitxer' };
  for (const [sel, camp] of Object.entries(camps)) $(sel).addEventListener('input', ev => { estat.examen[camp] = ev.target.value; marcaDesactualitzat(); desa(); });
  $('#e-procedencia').onchange = ev => { estat.examen.procedencia = ev.target.checked; marcaDesactualitzat(); desa(); };

  // Examen: exercicis
  $('#items').addEventListener('click', ev => {
    const b = ev.target.closest('[data-accio]');
    if (!b) return;
    const el = b.closest('.item');
    const items = estat.examen.items;
    const k = items.findIndex(i => i.uid === el.dataset.uid);
    const accio = b.dataset.accio;
    if (accio === 'amunt' && k > 0) { [items[k - 1], items[k]] = [items[k], items[k - 1]]; canviExamen(); }
    if (accio === 'avall' && k < items.length - 1) { [items[k + 1], items[k]] = [items[k], items[k + 1]]; canviExamen(); }
    if (accio === 'treu') {
      const [tret] = items.splice(k, 1);
      canviExamen();
      avis('Exercici tret de l\'examen', { text: 'Desfés', fes: () => { items.splice(k, 0, tret); canviExamen(); } });
    }
    if (accio === 'edita') obreEditor(items[k].uid);
    if (accio === 'detall') obreDetall(items[k].id, items.map(i => i.id).filter(Boolean));
  });
  $('#items').addEventListener('change', ev => {
    const el = ev.target.closest('.item');
    if (!el) return;
    const item = estat.examen.items.find(i => i.uid === el.dataset.uid);
    if (ev.target.dataset.inclou != null) item.apartats[+ev.target.dataset.inclou].inclou = ev.target.checked;
    if (ev.target.dataset.punts != null) item.apartats[+ev.target.dataset.punts].punts = Math.max(0, llegeixPunts(ev.target.value));
    canviExamen();
  });
  $('#afegeix-propi').onclick = () => {
    const item = { uid: crypto.randomUUID(), id: null, titol: 'Exercici propi', text: PLANTILLA_PROPI, apartats: apartatsDe(PLANTILLA_PROPI) };
    estat.examen.items.push(item);
    canviExamen();
    obreEditor(item.uid);
  };
  $('#reescala').onclick = () => reescala(llegeixPunts($('#reescala-total').value));
  $('#buida-examen').onclick = () => {
    if (!estat.examen.items.length) return;
    const anteriors = estat.examen.items;
    estat.examen.items = [];
    canviExamen();
    avis('Examen buidat', { text: 'Desfés', fes: () => { estat.examen.items = anteriors; canviExamen(); } });
  };
  $('#desa-projecte').onclick = () => {
    const dades = { format: 'pau-fisica-examen', versio: 1, desat: new Date().toISOString(), examen: estat.examen };
    descarrega(`${nomFitxer()}.json`, JSON.stringify(dades, null, 1), 'application/json');
  };
  $('#obre-projecte').onchange = async ev => {
    try {
      const d = JSON.parse(await llegeixFitxer(ev.target));
      if (d.format !== 'pau-fisica-examen' || !Array.isArray(d.examen?.items)) throw new Error('no és un projecte d\'examen');
      const desconeguts = d.examen.items.filter(i => i.id && !EX.has(i.id));
      d.examen.items = d.examen.items.filter(i => !i.id || EX.has(i.id));
      estat.examen = { ...examenNou(), ...d.examen };
      canviExamen(); pintaExamen();
      avis(desconeguts.length ? `Projecte obert (${desconeguts.length} exercicis ja no existeixen a la base de dades)` : 'Projecte obert');
    } catch (e) { avis(`No s'ha pogut obrir: ${e.message}`); }
  };

  // Editor
  $('#ed-text').addEventListener('input', previEditor);
  $('#ed-desa').onclick = desaEditor;
  $('#ed-restaura').onclick = () => { $('#ed-text').value = EX.get(editant.id).enunciat; previEditor(); };

  // Sortida
  $('#genera-pdf').onclick = generaPdf;
  $('#baixa-pdf').onclick = () => descarrega(`${ultimPdf.nom}.pdf`, ultimPdf.pdf, 'application/pdf');
  $('#baixa-zip').onclick = async () => {
    try {
      const z = await zip({ ambPdf: true, carpeta: true });
      descarrega(`${ultimPdf.nom}.zip`, await z.generateAsync({ type: 'blob' }));
    } catch (e) { avis(e.message); }
  };
  $('#obre-overleaf').onclick = () => obreOverleaf().catch(e => avis(e.message));
  $('#mostra-tex').onclick = () => { $('#codi-tex').textContent = ultimPdf.tex; $('#dialeg-tex').showModal(); };

  // Revisió
  $('#r-filtre').addEventListener('click', ev => {
    const b = ev.target.closest('.xip');
    if (b) { filtreRevisio = b.dataset.valor; pintaRevisio(); }
  });
  $('#taula-revisio').addEventListener('click', ev => {
    const tr = ev.target.closest('tr[data-id]');
    if (tr) obreDetall(tr.dataset.id, JSON.parse($('#taula-revisio').dataset.ids), 'revisio');
  });
  $('#exporta-revisions').onclick = () => {
    const n = Object.keys(estat.revisions).length;
    if (!n) { avis('Encara no hi ha cap revisió per exportar.'); return; }
    const dades = { format: 'pau-fisica-revisions', versio: 1, exportat: new Date().toISOString(), revisions: estat.revisions };
    descarrega('revisions.json', JSON.stringify(dades, null, 1), 'application/json');
  };
  $('#importa-revisions').onchange = async ev => {
    try {
      const d = JSON.parse(await llegeixFitxer(ev.target));
      if (d.format !== 'pau-fisica-revisions') throw new Error('no és un fitxer de revisions');
      let n = 0;
      for (const [id, r] of Object.entries(d.revisions || {})) if (EX.has(id)) { estat.revisions[id] = { ...estat.revisions[id], ...r }; indexa(id); n++; }
      desa(); pintaComptadorRevisio(); pintaRevisio(); pintaFiltres(); cerca();
      avis(`${n} revisions importades`);
    } catch (e) { avis(`No s'ha pogut importar: ${e.message}`); }
  };
  $('#esborra-revisions').onclick = () => {
    if (!Object.keys(estat.revisions).length) return;
    if (!confirm('Vols esborrar totes les revisions desades en aquest navegador? Si no les has exportades, es perdran.')) return;
    estat.revisions = {};
    for (const id of EX.keys()) indexa(id);
    desa(); pintaComptadorRevisio(); pintaRevisio(); pintaFiltres(); cerca();
  };

  window.addEventListener('hashchange', () => {
    const v = location.hash.slice(1);
    if (['cerca', 'examen', 'revisio'].includes(v)) mostraVista(v);
  });
}

// ---------------------------------------------------------------- inici
async function inici() {
  if (window.self !== window.top) $('#obre-pestanya').hidden = false;
  $('#obre-pestanya').href = location.href.split('#')[0];
  try {
    BASE = await (await fetch('dades/base.json')).json();
  } catch (e) {
    $('#subtitol').textContent = 'No s\'ha pogut carregar la base de dades.';
    $('#llista').innerHTML = `<div class="sense-resultats">No s'ha pogut carregar <code>dades/base.json</code>. Si has obert el fitxer directament, cal servir la carpeta amb un servidor web (vegeu el README).</div>`;
    return;
  }
  BLOCS = Object.keys(BASE.taxonomia.blocs);
  for (const e of BASE.exercicis) EX.set(e.id, e);
  carregaEstat();
  for (const r of Object.keys(estat.revisions)) if (!EX.has(r)) delete estat.revisions[r];
  for (const id of EX.keys()) indexa(id);
  const data = new Date(BASE.generat).toLocaleDateString('ca-ES');
  $('#subtitol').textContent = `${EX.size} exercicis · base de dades del ${data}`;
  connecta();
  pintaFiltres();
  pintaComptadorRevisio();
  cerca();
  $('#n-examen').textContent = estat.examen.items.length;
  const v = location.hash.slice(1);
  mostraVista(['cerca', 'examen', 'revisio'].includes(v) ? v : 'cerca');
}

inici();
