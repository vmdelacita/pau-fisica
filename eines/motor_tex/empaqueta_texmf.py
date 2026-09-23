#!/usr/bin/env python3
"""Empaqueta l'arbre TeX reduït com a paquet de dades de BusyTeX
(format Emscripten, sense LZ4): NOM.data + NOM.js.

  empaqueta_texmf.py                         eines/motor_tex/texmf -> web/motor/texlive-pau
  empaqueta_texmf.py ARREL SORTIDA_DIR NOM

Abans d'empaquetar regenera ARREL/texlive/texmf-dist/ls-R (la base de dades de
fitxers de kpathsea): per afegir un paquet LaTeX n'hi ha prou de copiar-ne els
fitxers a texmf/texlive/texmf-dist/tex/latex/<paquet>/ i tornar a executar això.
"""
import hashlib
import json
import os
import sys
from pathlib import Path

LOADER = r"""// Paquet de dades generat per empaqueta_texmf.py (format Emscripten sense LZ4).
var Module = typeof BusytexPipeline != 'undefined' ? BusytexPipeline : {};
if (!Module['expectedDataFileDownloads']) Module['expectedDataFileDownloads'] = 0;
Module['expectedDataFileDownloads']++;
(() => {
  var isPthread = typeof ENVIRONMENT_IS_PTHREAD != 'undefined' && ENVIRONMENT_IS_PTHREAD;
  var isWasmWorker = typeof ENVIRONMENT_IS_WASM_WORKER != 'undefined' && ENVIRONMENT_IS_WASM_WORKER;
  if (isPthread || isWasmWorker) return;
  var metadata = __METADATA__;
  var REMOTE_PACKAGE_BASE = '__NOM__.data';
  var DEP = 'datafile___NOM__';
  // La mateixa descàrrega serveix per a totes les recàrregues del mòdul.
  self.__paquetsPau = self.__paquetsPau || {};
  function descarrega(url) {
    if (!self.__paquetsPau[url]) {
      self.__paquetsPau[url] = (async () => {
        var r = await fetch(url);
        if (!r.ok) throw new Error(r.status + ': ' + r.url);
        var total = Number(r.headers.get('Content-Length') || metadata.remote_package_size);
        var reader = r.body.getReader(), chunks = [], loaded = 0;
        while (true) {
          var { done, value } = await reader.read();
          if (done) break;
          chunks.push(value); loaded += value.length;
          Module['setStatus'] && Module['setStatus']('Downloading data... (' + loaded + '/' + total + ')');
        }
        var out = new Uint8Array(loaded), off = 0;
        for (var c of chunks) { out.set(c, off); off += c.length; }
        return out;
      })();
    }
    return self.__paquetsPau[url];
  }
  async function runWithFS(Module) {
    Module['addRunDependency'](DEP);
    for (var d of metadata.dirs) {
      var i = d.lastIndexOf('/');
      Module['FS_createPath'](d.slice(0, i) || '/', d.slice(i + 1), true, true);
    }
    var url = Module['locateFile'] ? Module['locateFile'](REMOTE_PACKAGE_BASE, '') : REMOTE_PACKAGE_BASE;
    var bytes = await descarrega(url);
    for (var f of metadata.files) {
      Module['FS_createDataFile'](f.filename, null, bytes.subarray(f.start, f.end), true, true, true);
    }
    Module['removeRunDependency'](DEP);
  }
  if (Module['calledRun']) {
    runWithFS(Module);
  } else {
    if (!Module['preRun']) Module['preRun'] = [];
    Module['preRun'].push(runWithFS);
  }
})();
"""


AQUI = Path(__file__).resolve().parent


def genera_ls_r(texmf):
    linies = ["% ls-R -- filename database for kpathsea; do not change this line."]
    for d, ds, fs in sorted(os.walk(texmf)):
        rel = os.path.relpath(d, texmf)
        linies += ["", ("." if rel == "." else "./" + rel) + ":"]
        linies += sorted(ds) + sorted(f for f in fs if f != "ls-R" or rel != ".")
    (texmf / "ls-R").write_text("\n".join(linies) + "\n", encoding="utf-8")


def main():
    if len(sys.argv) == 4:
        arrel, sortida, nom = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
    else:
        arrel, sortida, nom = AQUI / "texmf", AQUI.parent.parent / "web" / "motor", "texlive-pau"
    texmf = arrel / "texlive" / "texmf-dist"
    if texmf.is_dir():
        genera_ls_r(texmf)
    fitxers, dirs = [], set()
    for p in sorted(arrel.rglob("*")):
        if p.is_file() and p.name != ".DS_Store":
            rel = "/" + p.relative_to(arrel).as_posix()
            fitxers.append((rel, p.read_bytes()))
            d = rel.rsplit("/", 1)[0]
            while d:
                dirs.add(d)
                d = d.rsplit("/", 1)[0]
    dades = bytearray()
    meta_fitxers = []
    for rel, contingut in fitxers:
        meta_fitxers.append({"filename": rel, "start": len(dades), "end": len(dades) + len(contingut)})
        dades += contingut
    meta = {
        "files": meta_fitxers,
        "dirs": sorted(dirs, key=lambda d: (d.count("/"), d)),
        "remote_package_size": len(dades),
        "package_uuid": "sha256-" + hashlib.sha256(dades).hexdigest(),
    }
    sortida.mkdir(parents=True, exist_ok=True)
    (sortida / f"{nom}.data").write_bytes(dades)
    js = LOADER.replace("__METADATA__", json.dumps(meta, separators=(",", ":"))).replace("__NOM__", nom)
    (sortida / f"{nom}.js").write_text(js, encoding="utf-8")
    print(f"{len(fitxers)} fitxers, {len(dades) / 1e6:.1f} MB -> {sortida / nom}.data/.js")


if __name__ == "__main__":
    main()
