# Lektoria — live demo

**[Open the demo →](https://connectslide121.github.io/Lektoria-livedemo/)**

Lektoria is an assessment tool for teachers in Swedish schools. Teachers
organise their classes, set assignments against Skolverket's knowledge
requirements, mark each skill on the A–F scale, track homework and retakes, and
see every student's progress per skill at a glance.

It is built with Angular 20 (standalone components, signals, zoneless), Tailwind
and ngx-translate (Swedish and English), and ships as an offline-first Electron
desktop app that keeps all data on the teacher's own computer.

## About this demo

This repository only holds a built copy of the app for the browser. It opens
with three **fictional** classes, so there is something to explore: every
student, mark and comment is invented.

- Everything you change is saved in your own browser (localStorage) and nowhere
  else.
- To start over with the original demo data, open
  [`?reset-demo`](https://connectslide121.github.io/Lektoria-livedemo/?reset-demo).

## Rebuilding the demo

The demo is a normal production build of Lektoria plus three things, applied by
[`tools/assemble.sh`](tools/assemble.sh):

1. [`demo-seed.js`](demo-seed.js) is loaded before the app and writes the fictional
   data (dates are generated relative to today, so the demo never goes stale).
2. `<base href>` is set to `/Lektoria-livedemo/`, and `index.html` is copied to
   `404.html` so deep links work on GitHub Pages.
3. Root-relative asset paths (the logo, the criteria and translation fetches) are
   made relative, so they resolve under the subpath.

```sh
# in the Lektoria client
npx ng build --output-path ../demo-build
# then, from a checkout of this repo
sh tools/assemble.sh ../demo-build/browser ./site   # copy demo-seed.js next to it first
```
