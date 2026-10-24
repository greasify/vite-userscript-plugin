# XHR and resource example

`GM.xmlHttpRequest` plus `@connect`, and a local `@resource` read with `GM_getResourceText` / `GM.getResourceUrl`.

`resource: [['hint', 'hint.json']]` is relative. `pnpm dev` joins it to the Vite origin so Tampermonkey can fetch `/hint.json` from localhost (`public/hint.json`). `pnpm build` joins it to `homepage`.

```bash
pnpm dev
pnpm build
```

Install the printed `*.dev.user.js` URL. HTTPS and `public/` notes: [FAQ](../../README.md#faq).
