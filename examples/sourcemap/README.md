# Sourcemap example

Vanilla userscript with `build.minify` and `build.sourcemap`. The metablock stays readable; the body is minified and the map points back at `src/`.

```bash
pnpm build
```

Writes `{fileName}.user.js`, `{fileName}.user.js.map`, and `{fileName}.meta.js`. The map is offset past the metablock and `file` is the `.user.js` name.

Install the built userscript, click **Throw**, and open the stack in DevTools — it should land on `src/counter.ts`, not the IIFE.

Tampermonkey often does not fetch a sibling `.map`. Serve both files from the same origin (static host / GitHub Pages) so the browser can load the map.

```bash
pnpm dev
```

Install the printed `*.dev.user.js` URL. On HTTPS sites use `server.https`. Do not use `public/` for assets.
