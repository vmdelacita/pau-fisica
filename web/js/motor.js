// Motor LaTeX al navegador: BusyTeX (pdfLaTeX de TeX Live 2026 compilat a WebAssembly)
// amb un paquet TeX reduït (motor/texlive-pau.data) que inclou la plantilla i els
// paquets que fan servir els exercicis.
import { BusyTexRunner, PdfLatex } from '../motor/busytex-runner.js';

// Les rutes han de ser absolutes: el worker les resol respecte a la seva pròpia URL.
const BASE = new URL('motor', document.baseURI).href;

let runner = null;
let preparat = null;
let cua = Promise.resolve();

export function estaPreparat() {
  return runner?.isInitialized() ?? false;
}

// Descarrega i inicialitza el motor (només la primera vegada).
export function prepara() {
  if (!preparat) {
    runner = new BusyTexRunner({
      busytexBasePath: BASE,
      preloadDataPackages: [`${BASE}/texlive-pau.js`],
      catalogDataPackages: [],
    });
    preparat = runner.initialize(true).catch(e => { preparat = null; runner = null; throw e; });
  }
  return preparat;
}

// Compila un document. fitxers: [{ path, content: Uint8Array|string }]
// Retorna { ok, pdf, log, errors }
export function compila(tex, fitxers) {
  const feina = cua.then(async () => {
    await prepara();
    const r = await new PdfLatex(runner).compile({ input: tex, additionalFiles: fitxers, rerun: true });
    return { ok: r.success && !!r.pdf?.length, pdf: r.pdf, log: r.log, errors: errorsDelLog(r.log, tex) };
  });
  cua = feina.catch(() => {});
  return feina;
}

// Extreu els errors del log de LaTeX amb la línia del document on s'han produït.
export function errorsDelLog(log, tex) {
  const linies = (log || '').split('\n');
  const texLinies = tex.split('\n');
  const errors = [];
  for (let i = 0; i < linies.length; i++) {
    if (!linies[i].startsWith('!')) continue;
    let missatge = linies[i].slice(1).trim();
    let linia = null;
    for (let j = i + 1; j < Math.min(i + 12, linies.length); j++) {
      const m = /^l\.(\d+)/.exec(linies[j]);
      if (m) { linia = +m[1]; break; }
    }
    if (/^(Emergency stop|==> Fatal error)/.test(missatge) && errors.length) continue;
    if (errors.some(e => e.missatge === missatge && e.linia === linia)) continue;
    const context = linia ? texLinies.slice(Math.max(0, linia - 2), linia + 1).join('\n') : '';
    errors.push({ missatge, linia, context, explicacio: explica(missatge) });
  }
  return errors;
}

// Explicació en català dels errors més habituals.
function explica(m) {
  if (/Undefined control sequence/.test(m)) return 'Hi ha una comanda que LaTeX no coneix: potser està mal escrita o és d\'un paquet que no s\'ha carregat.';
  if (/File `(.+)' not found/.test(m)) return 'Aquest fitxer o paquet no és al motor LaTeX de la web. Pots obrir el document a Overleaf o compilar-lo a l\'ordinador.';
  if (/Missing \$ inserted/.test(m)) return 'Hi ha un símbol matemàtic (_, ^, \\frac…) fora d\'una fórmula, o falta tancar un $.';
  if (/Missing \} inserted|Extra \}|Too many \}'s/.test(m)) return 'Les claus { } no estan ben aparellades.';
  if (/\\begin\{.*\} on input line .* ended by \\end/.test(m)) return 'Un entorn \\begin{…} no es tanca amb el \\end{…} corresponent.';
  if (/Runaway argument|Paragraph ended before/.test(m)) return 'Probablement falta tancar una clau } en un argument.';
  return '';
}
