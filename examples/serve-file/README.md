# Serve file example

Vanilla userscript with `server.file`. `pnpm dev` watch-builds a headerless IIFE and serves a header-only proxy.

```bash
pnpm dev
pnpm build
```

Install the printed `*.proxy.user.js` URL. The proxy `@require`s `serve-file-example.js` from disk. Watch overwrites the IIFE; Violentmonkey polls the local file.

`pnpm build` writes `serve-file-example.user.js` + `.meta.js` — no proxy, no headerless `.js`.

HTTPS and `public/` notes: [FAQ](../../README.md#faq).
