# Sourcemap example

Vanilla userscript with `build.minify` and `build.sourcemap`. The metablock stays readable; the body is minified. The map is inlined into `.user.js` as a `data:` `sourceMappingURL`, so DevTools can open `src/` without a sibling `.map` file or a static host.

`homepage` + `autoMetaUrls` still fill `@updateURL` / `@downloadURL`. They do not host the map.

```bash
pnpm build
```

Writes `{fileName}.user.js` and `{fileName}.meta.js`. Install the userscript, click **Throw**, and open the stack in DevTools — it should land on `src/counter.ts`, not the IIFE. The inline map is offset past the metablock.

```bash
pnpm dev
```

Install the printed `*.dev.user.js` URL. On HTTPS sites use `server.https`. Do not use `public/` for assets.
