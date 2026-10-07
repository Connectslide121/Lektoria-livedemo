#!/bin/sh
# Builds the demo site from Lektoria's Angular build: seed script, Pages
# fallback, subpath fixes. Usage: assemble.sh <build/browser> <out dir>
set -e
B="$1"; D="$2"; HERE="$(dirname "$0")"
rm -rf "$D" && mkdir -p "$D"
cp -r "$B/." "$D/"
cp "$HERE/demo-seed.js" "$D/"
python - "$D" <<'PY'
import sys, os, re, glob
d = sys.argv[1]
p = os.path.join(d, 'index.html')
s = open(p, encoding='utf-8').read()
s = re.sub(r'<base href="[^"]*">', '<base href="/Lektoria-livedemo/">\n  <script src="demo-seed.js"></script>', s, 1)
s = s.replace('href="/lektoria_circle_logo.png"', 'href="lektoria_circle_logo.png"')
open(p, 'w', encoding='utf-8').write(s)
open(os.path.join(d, '404.html'), 'w', encoding='utf-8').write(s)
open(os.path.join(d, '.nojekyll'), 'w').write('')
# root-relative asset paths in templates break under the /Lektoria-livedemo/ subpath
for f in glob.glob(os.path.join(d, '*.js')):
    t = open(f, encoding='utf-8').read()
    # (the logo in templates; criteria and i18n fetches). Relative URLs resolve
    # against <base href>, so they work under the subpath.
    u = t.replace('"/lektoria_circle_logo.png"', '"lektoria_circle_logo.png"').replace('"/assets/', '"assets/')
    if u != t:
        open(f, 'w', encoding='utf-8').write(u)
PY
