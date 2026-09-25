// Conversor LaTeX -> HTML per a la previsualització dels exercicis.
// Cobreix el subconjunt de LaTeX definit a base_dades/FORMAT.md; les fórmules
// es deixen intactes perquè les compongui MathJax.

const ENTORNS_MATEMATICS = ['align', 'align*', 'gather', 'gather*', 'equation', 'equation*',
  'multline', 'multline*', 'eqnarray', 'eqnarray*'];

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Treu els comentaris (% fins al final de línia, excepte \%).
function treuComentaris(s) {
  return s.split('\n').map(l => {
    for (let i = 0; i < l.length; i++) {
      if (l[i] === '\\') { i++; continue; }
      if (l[i] === '%') return l.slice(0, i);
    }
    return l;
  }).join('\n');
}

// Puntuació de la pauta dins d'una fórmula (\punts{0,2} o \text{\punts{0,2}}): MathJax no
// coneix \punts, així que es passa a text en color (com .punts fora de les fórmules).
const RE_PUNTS_MATH = /\\text\{\s*\\punts\{([^}]*)\}\s*\}|\\punts\{([^}]*)\}/g;

// Retoca una fórmula perquè MathJax la mostri com LaTeX amb icomma.
function preparaMath(m) {
  // Les puntuacions es reserven abans de posar la coma decimal com a {,}, que dins del
  // text de \textbf es veuria tal qual.
  const punts = [];
  return m.replace(RE_PUNTS_MATH, (_, a, b) => `\u0002${punts.push(a ?? b) - 1}\u0002`)
    .replace(/(\d),(?=\d)/g, '$1{,}').replace(/·/g, '\\cdot ')
    .replace(/\u0002(\d+)\u0002/g, (_, k) => `\\textcolor{#9c2a1f}{\\textbf{${punts[k]} p}}`);
}

// Separa les fórmules del text i les substitueix per marques \u0001N\u0001.
function extreuMath(s, formules) {
  let out = '';
  let i = 0;
  const desa = (html) => { formules.push(html); return `\u0001${formules.length - 1}\u0001`; };
  while (i < s.length) {
    const c = s[i];
    if (c === '\\' && s[i + 1] === '\\') { out += '\\\\'; i += 2; continue; }
    if (c === '\\' && s[i + 1] === '$') { out += '\\$'; i += 2; continue; }
    if (c === '\\' && (s[i + 1] === '[' || s[i + 1] === '(')) {
      const tanca = s[i + 1] === '[' ? '\\]' : '\\)';
      const j = s.indexOf(tanca, i + 2);
      if (j >= 0) {
        const cos = preparaMath(s.slice(i + 2, j));
        out += desa(s[i + 1] === '[' ? `<div class="md">\\[${esc(cos)}\\]</div>` : `<span class="mi">\\(${esc(cos)}\\)</span>`);
        i = j + 2; continue;
      }
    }
    if (c === '\\' && s.startsWith('\\begin{', i)) {
      const nom = s.slice(i + 7, s.indexOf('}', i + 7));
      if (ENTORNS_MATEMATICS.includes(nom)) {
        const fi = `\\end{${nom}}`;
        const j = s.indexOf(fi, i);
        if (j >= 0) {
          out += desa(`<div class="md">${esc(preparaMath(s.slice(i, j + fi.length)))}</div>`);
          i = j + fi.length; continue;
        }
      }
    }
    if (c === '$') {
      const doble = s[i + 1] === '$';
      const obre = doble ? 2 : 1;
      let j = i + obre;
      while (j < s.length) {
        if (s[j] === '\\') { j += 2; continue; }
        if (s[j] === '$' && (!doble || s[j + 1] === '$')) break;
        j++;
      }
      if (j < s.length) {
        const cos = preparaMath(s.slice(i + obre, j));
        out += desa(doble ? `<div class="md">\\[${esc(cos)}\\]</div>` : `<span class="mi">\\(${esc(cos)}\\)</span>`);
        i = j + obre; continue;
      }
    }
    out += c; i++;
  }
  return out;
}

// Llegeix un grup {...} a partir de la posició i (saltant espais). Retorna [contingut, posició final].
function llegeixGrup(s, i) {
  while (s[i] === ' ' || s[i] === '\n') i++;
  if (s[i] !== '{') {
    // argument d'un sol caràcter o comanda
    if (s[i] === '\\') { const m = /^\\[A-Za-z]+|^\\./.exec(s.slice(i)); return [m[0], i + m[0].length]; }
    return [s[i] || '', i + 1];
  }
  let prof = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '\\') { j++; continue; }
    if (s[j] === '{') prof++;
    else if (s[j] === '}') { prof--; if (prof === 0) return [s.slice(i + 1, j), j + 1]; }
  }
  return [s.slice(i + 1), s.length];
}

function llegeixOpcional(s, i) {
  let k = i;
  while (s[k] === ' ') k++;
  if (s[k] !== '[') return [null, i];
  const j = s.indexOf(']', k);
  return j < 0 ? [null, i] : [s.slice(k + 1, j), j + 1];
}

// Troba el \end{nom} corresponent (tenint en compte entorns niats del mateix nom).
function trobaFi(s, i, nom) {
  const obre = `\\begin{${nom}}`, tanca = `\\end{${nom}}`;
  let prof = 1, j = i;
  while (j < s.length) {
    const a = s.indexOf(obre, j), b = s.indexOf(tanca, j);
    if (b < 0) return [s.length, s.length];
    if (a >= 0 && a < b) { prof++; j = a + obre.length; continue; }
    prof--;
    if (prof === 0) return [b, b + tanca.length];
    j = b + tanca.length;
  }
  return [s.length, s.length];
}

// Divideix per un separador al nivell 0 de claus (p. ex. files i cel·les de taules).
function divideix(s, sep) {
  const parts = [];
  let prof = 0, ini = 0;
  for (let j = 0; j < s.length; j++) {
    if (s[j] === '\\' && !s.startsWith(sep, j)) { j++; continue; }
    if (s[j] === '{') prof++;
    else if (s[j] === '}') prof--;
    else if (prof === 0 && s.startsWith(sep, j)) {
      parts.push(s.slice(ini, j)); ini = j + sep.length; j += sep.length - 1;
    }
  }
  parts.push(s.slice(ini));
  return parts;
}

const IGNORA_0 = new Set(['medskip', 'smallskip', 'bigskip', 'noindent', 'hfill', 'vfill', 'centering',
  'small', 'footnotesize', 'scriptsize', 'large', 'Large', 'normalsize', 'raggedright', 'linewidth',
  'textwidth', 'nopagebreak', 'pagebreak', 'newpage', 'clearpage', 'hline', 'toprule', 'midrule',
  'bottomrule', 'indent', 'relax', 'protect', 'displaystyle']);
const IGNORA_1 = new Set(['hspace', 'hspace*', 'vspace', 'vspace*', 'label', 'cline', 'setlength']);
const SIMBOLS = { ldots: '…', dots: '…', quad: '\u2003', qquad: '\u2003\u2003', euro: '€', '%': '%',
  '&': '&amp;', '#': '#', '_': '_', '$': '$', '{': '{', '}': '}', ',': '\u2009', ' ': ' ', '-': '',
  '/': '', '\\': '<br>', textbackslash: '\\', textdegree: '°', S: '§', newline: '<br>', par: '\n\n' };
const COLORS = { red: '#b3261e', blue: '#1b4fb3', green: '#1e7a3c', gray: '#666', black: 'inherit' };

class Conversor {
  constructor(opts) {
    this.opts = opts;
    this.nApartat = 0;
    this.nSolapartat = 0;
  }

  // Converteix un fragment amb paràgrafs.
  blocs(s) {
    const nodes = this.nodes(s);
    let html = '', par = '';
    const buida = () => { if (par.trim()) html += `<div class="par">${par.trim()}</div>`; par = ''; };
    for (const n of nodes) {
      if (n.t === 'par') buida();
      else if (n.t === 'bloc') { buida(); html += n.h; }
      else par += n.h;
    }
    buida();
    return html;
  }

  // Converteix un fragment en línia (sense paràgrafs).
  linia(s) {
    return this.nodes(s).map(n => n.t === 'par' ? '<br>' : n.h).join('');
  }

  nodes(s) {
    const out = [];
    const text = h => out.push({ t: 'in', h });
    const bloc = h => out.push({ t: 'bloc', h });
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === '\u0001') {
        const j = s.indexOf('\u0001', i + 1);
        const h = this.opts.formules[+s.slice(i + 1, j)];
        (h.startsWith('<div') ? bloc : text)(h);
        i = j + 1; continue;
      }
      if (c === '\n') {
        let j = i; let n = 0;
        while (j < s.length && /\s/.test(s[j])) { if (s[j] === '\n') n++; j++; }
        if (n >= 2) out.push({ t: 'par' }); else text(' ');
        i = j; continue;
      }
      if (c === '{' || c === '}') {
        if (c === '{') { const [g, j] = llegeixGrup(s, i); text(this.linia(g)); i = j; } else i++;
        continue;
      }
      if (c === '~') { text('&nbsp;'); i++; continue; }
      if (c === '-' && s.startsWith('---', i)) { text('—'); i += 3; continue; }
      if (c === '-' && s.startsWith('--', i)) { text('–'); i += 2; continue; }
      if (c === '`' && s[i + 1] === '`') { text('“'); i += 2; continue; }
      if (c === "'" && s[i + 1] === "'") { text('”'); i += 2; continue; }
      if (c === '<' || c === '>' || c === '&') { text(esc(c)); i++; continue; }
      if (c !== '\\') { text(c); i++; continue; }

      // Comandes
      const m = /^\\([A-Za-z]+\*?|.)/.exec(s.slice(i));
      if (!m) { i++; continue; }
      const nom = m[1];
      i += m[0].length;
      if (nom === '\\') { // \\ i \\[1em]
        const [, j] = llegeixOpcional(s, i); i = j; text('<br>'); continue;
      }
      if (nom in SIMBOLS) { const v = SIMBOLS[nom]; if (v === '\n\n') out.push({ t: 'par' }); else text(v); continue; }
      if (IGNORA_0.has(nom)) continue;
      if (IGNORA_1.has(nom)) { const [, j] = llegeixGrup(s, i); i = j; continue; }
      if (nom === 'setcounter') { let [, j] = llegeixGrup(s, i); [, j] = llegeixGrup(s, j); i = j; continue; }
      if (nom === 'rule') { let [, j] = llegeixOpcional(s, i); [, j] = llegeixGrup(s, j); [, j] = llegeixGrup(s, j); i = j; continue; }

      if (nom === 'begin') {
        const [env, j] = llegeixGrup(s, i);
        const [fi, despres] = trobaFi(s, j, env);
        bloc(this.entorn(env, s.slice(j, fi)));
        i = despres; continue;
      }
      if (nom === 'figura') {
        const [ample, j0] = llegeixOpcional(s, i);
        const [fitxer, j] = llegeixGrup(s, j0);
        const w = Math.min(100, Math.round(parseFloat(ample || '0.5') * 100));
        const src = this.opts.figura ? this.opts.figura(fitxer.trim()) : fitxer;
        bloc(`<div class="figura"><img loading="lazy" src="${esc(src)}" alt="${esc(fitxer)}" style="width:${w}%"></div>`);
        i = j; continue;
      }
      if (nom === 'dades' || nom === 'nota') {
        const [g, j] = llegeixGrup(s, i);
        bloc(`<div class="etiquetat"><span class="etq">${nom === 'dades' ? 'Dades:' : 'Nota:'}</span><div>${this.linia(g)}</div></div>`);
        i = j; continue;
      }
      if (nom === 'punts') {
        const [g, j] = llegeixGrup(s, i);
        text(`<span class="punts">${esc(g)} p</span> `);
        i = j; continue;
      }
      if (nom === 'destaca') {
        const [g, j] = llegeixGrup(s, i); text(`<strong class="destaca">${this.linia(g)}</strong>`); i = j; continue;
      }
      const estils = { textbf: 'strong', textit: 'em', emph: 'em', textsc: 'span class="sc"', texttt: 'code',
        underline: 'u', textrm: 'span', textsf: 'span', mbox: 'span', text: 'span' };
      if (nom in estils) {
        const [g, j] = llegeixGrup(s, i);
        const tag = estils[nom];
        text(`<${tag}>${this.linia(g)}</${tag.split(' ')[0]}>`);
        i = j; continue;
      }
      if (nom === 'textcolor') {
        let [col, j] = llegeixGrup(s, i);
        const [g, j2] = llegeixGrup(s, j);
        const base = col.split('!')[0];
        text(`<span style="color:${COLORS[base] || 'inherit'}">${this.linia(g)}</span>`);
        i = j2; continue;
      }
      if (nom === 'item') { // fora d'una llista
        const [, j] = llegeixOpcional(s, i); i = j; text('• '); continue;
      }
      // Comanda desconeguda: se'n mostren els arguments
      while (s[i] === '[' || s[i] === '{') {
        if (s[i] === '[') { const [, j] = llegeixOpcional(s, i); i = j; } else { const [g, j] = llegeixGrup(s, i); text(this.linia(g)); i = j; }
      }
    }
    return out;
  }

  entorn(env, cos) {
    if (env === 'apartat') {
      const [punts, j] = llegeixGrup(cos, 0);
      const k = this.nApartat++;
      const etq = this.opts.etiquetaApartat ? this.opts.etiquetaApartat(k) : String.fromCharCode(97 + k) + ')';
      const p = this.opts.puntsApartat ? this.opts.puntsApartat(k, punts) : punts;
      const pts = this.opts.mostraPunts !== false && p ? ` <span class="pts">[${esc(textPunts(p))}]</span>` : '';
      return `<div class="apartat"><span class="etq">${etq}</span><div class="cos">${this.blocs(cos.slice(j))}${pts}</div></div>`;
    }
    if (env === 'solapartat') {
      const k = this.nSolapartat++;
      return `<div class="solapartat"><div class="etq">${String.fromCharCode(97 + k)})</div>${this.blocs(cos)}</div>`;
    }
    if (env === 'itemize' || env === 'enumerate') {
      const tag = env === 'itemize' ? 'ul' : 'ol';
      const items = divideix(cos, '\\item').slice(1).map(it => {
        const [, j] = llegeixOpcional(it, 0);
        return `<li>${this.blocs(it.slice(j))}</li>`;
      });
      return `<${tag}>${items.join('')}</${tag}>`;
    }
    if (env === 'center') return `<div class="center">${this.blocs(cos)}</div>`;
    if (env === 'minipage') {
      let [, j] = llegeixOpcional(cos, 0);
      const [ample, j2] = llegeixGrup(cos, j);
      const f = parseFloat(ample) || 0.5;
      return `<div class="minipage" style="width:${Math.round(f * 100) - 1}%">${this.blocs(cos.slice(j2))}</div>`;
    }
    if (env === 'tabular' || env === 'tabular*' || env === 'tabularx') {
      let j = 0;
      if (env !== 'tabular') { [, j] = llegeixGrup(cos, j); }
      const [espec, j2] = llegeixGrup(cos, j);
      const alineacions = espec.replace(/[|@>{}<]|p\{[^}]*\}|m\{[^}]*\}/g, m => m.startsWith('p') || m.startsWith('m') ? 'l' : '').split('');
      const vores = espec.includes('|') ? ' vores' : '';
      const files = divideix(cos.slice(j2), '\\\\')
        .map(f => f.replace(/^\s*\[[^\]]*\]/, '').replace(/\\(hline|toprule|midrule|bottomrule)|\\cline\{[^}]*\}/g, '').trim())
        .filter(f => f.length);
      const cos_ = files.map(f => '<tr>' + divideix(f, '&').map((cel, k) => {
        const al = { c: 'center', r: 'right' }[alineacions[k]] || 'left';
        return `<td style="text-align:${al}">${this.linia(cel.trim())}</td>`;
      }).join('') + '</tr>').join('');
      return `<div class="taula"><table class="${vores}">${cos_}</table></div>`;
    }
    if (env === 'figure' || env === 'table') return this.blocs(cos.replace(/^\[[^\]]*\]/, ''));
    return `<div>${this.blocs(cos)}</div>`;
  }
}

export function textPunts(p) {
  const t = String(p).trim();
  return t === '1' ? '1 punt' : `${t} punts`;
}

// opts: { figura(nom) -> url, etiquetaApartat(k), puntsApartat(k, original), mostraPunts }
export function latexAHtml(src, opts = {}) {
  const formules = [];
  const s = extreuMath(treuComentaris(src), formules);
  return new Conversor({ ...opts, formules }).blocs(s);
}

// Text pla aproximat d'un fragment (per a la cerca).
export function latexAText(src) {
  return treuComentaris(src)
    .replace(/\\(begin|end)\{[^}]*\}(\{[^}]*\})?/g, ' ')
    .replace(/\\[A-Za-z]+\*?/g, ' ')
    .replace(/[{}$\\^_&~]/g, ' ')
    .replace(/\s+/g, ' ');
}
