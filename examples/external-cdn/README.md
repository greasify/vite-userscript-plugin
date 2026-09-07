# External CDN example

`jquery` is **not** installed. `@types/jquery` is types-only. Runtime `$` comes from the CDN `@require` in `vite.config.ts`.

The widget on `https://example.com/` is built with `$`: version from `$.fn.jquery`, counter via `.on('click')`. That is the point — `import $ from 'jquery'` type-checks, the bundle never ships jQuery.

```ts
userscript({
  entry: 'src/index.ts',
  header: { name: 'external-cdn-example', version: '0.0.0', match: 'https://example.com/' },
  external: {
    jquery: {
      global: '$',
      url: 'https://cdn.jsdelivr.net/npm/jquery@4.0.0/dist/jquery.min.js',
    },
  },
})
```

[`src/jquery.d.ts`](./src/jquery.d.ts) points TypeScript at `@types/jquery`. `import $ from 'jquery'` type-checks; the plugin maps that import to the CDN global.

```bash
pnpm dev
pnpm build
```

Install the printed `*.dev.user.js` URL. HTTPS and `public/` notes: [FAQ](../../README.md#faq).
