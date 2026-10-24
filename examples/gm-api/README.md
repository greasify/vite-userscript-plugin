# GM API example

Vanilla userscript that uses the APIs a real script actually needs: `GM_setValue` / `GM_getValue`, `GM_addValueChangeListener`, `GM_registerMenuCommand`, `GM_notification`, `GM_setClipboard`, and `GM_info`.

`header.grant` is left empty. Serve lists every grant. `pnpm build` scans the IIFE and writes only the grants in use.

```bash
pnpm dev
pnpm build
```

Install the printed `*.dev.user.js` URL. HTTPS and `public/` notes: [FAQ](../../README.md#faq).
