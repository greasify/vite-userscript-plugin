# Sourcemap example

Vanilla userscript with Vite `build.minify` and `build.sourcemap`. The metablock stays readable; the body is minified.

The map is inlined as a `data:` `sourceMappingURL`. Offset includes the metablock and the CSS prelude. No sibling `.map` file.

`homepage` + `autoMetaUrls` fill `@updateURL` / `@downloadURL`. They do not host the map.

`index.html` + `src/page.ts` is a Vite page next to the userscript. `pnpm dev` serves it at `/`. `pnpm build` writes the page to `dist/` alongside `{fileName}.user.js`. The install button reads the file from `virtual:vite-userscript-plugin`.

```bash
pnpm build
```

Install the userscript, click **Throw**, and open the stack in DevTools. It should land on `src/counter.ts`, not the IIFE.

```bash
pnpm dev
```

Install the printed `*.dev.user.js` URL. HTTPS and `public/` notes: [FAQ](../../README.md#faq).
