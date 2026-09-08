# Web Worker example

Vanilla userscript that reverses text in a module worker via `import Worker from './echo.ts?worker&inline'`.

HMR serve wraps `?worker` / `?worker&inline` in a data-URI so the host page can start the worker. `pnpm build` needs `&inline` — a plain `?worker` emits a separate file the match site cannot serve.

```bash
pnpm dev
pnpm build
```

Install the printed `*.dev.user.js` URL. HTTPS and `public/` notes: [FAQ](../../README.md#faq).
