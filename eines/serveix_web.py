#!/usr/bin/env python3
"""Serveix la web en local per provar-la: http://localhost:8000

  serveix_web.py [PORT]

(La web no funciona obrint index.html directament: necessita un servidor.)
"""
import functools
import http.server
import mimetypes
import sys
from pathlib import Path

WEB = Path(__file__).resolve().parent.parent / "web"

mimetypes.add_type("application/wasm", ".wasm")
mimetypes.add_type("text/javascript", ".js")


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(WEB))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as srv:
        print(f"Web servida a http://localhost:{port}  (Ctrl+C per aturar)")
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
