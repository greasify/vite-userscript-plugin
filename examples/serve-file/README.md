# Serve file example

Vanilla userscript with `server.file`. `pnpm dev` watch-builds a headed `.user.js`, a headerless IIFE, and a header-only proxy.

```bash
pnpm dev
pnpm build
```

Install the printed **Userscript** URL (`*.user.js`) — this works in Firefox. The **Proxy** URL `@require`s `serve-file-example.js` from disk; Violentmonkey can poll that file where `file://` is allowed.

`pnpm build` writes `serve-file-example.user.js` + `.meta.js` — no proxy, no headerless `.js`.

HTTPS and `public/` notes: [FAQ](../../README.md#faq).
