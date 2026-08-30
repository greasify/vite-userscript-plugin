# vite-userscript-plugin

[![npm](https://img.shields.io/npm/v/vite-userscript-plugin)](https://npmjs.com/vite-userscript-plugin)
[![license](https://img.shields.io/github/license/greasify/vite-userscript-plugin)](./LICENCE)
[![template](https://img.shields.io/github/package-json/v/greasify/vite-userscript-template?label=vite-userscript-template)](https://github.com/greasify/vite-userscript-template)

> A Vite plugin for developing and building Tampermonkey, Greasemonkey and Violentmonkey userscripts.

## Features

- 🔥 Vite HMR
- 🔧 Configure Userscript header
- 🎨 Inject CSS from imports and SFC components (Vue, Svelte)
- 💨 All `@grant`s in the header in dev mode
- 📝 Only used `@grant`s in the production build
- 📦 Built-in types for Tampermonkey, Greasemonkey and Violentmonkey
- 📄 Virtual module with script metadata

## Getting started

Requires **Vite 8** and Node `>=22`.

```bash
pnpm add vite-userscript-plugin -D
```

```ts
import { defineConfig } from 'vite'
import userscript from 'vite-userscript-plugin'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    userscript({
      entry: 'src/index.ts',
      header: {
        name: pkg.name,
        version: pkg.version,
        match: [
          'https://example.com/',
          'https://example.org/'
        ]
      }
    })
  ]
})
```

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

Add types: Vite, **one** manager (`tampermonkey`, `greasemonkey`, or `violentmonkey`), and the virtual module.

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
/// <reference types="vite-userscript-plugin/types/tampermonkey" />
/// <reference types="vite-userscript-plugin/virtual" />
```

Or `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": [
      "vite/client",
      "vite-userscript-plugin/types/tampermonkey",
      "vite-userscript-plugin/virtual"
    ]
  }
}
```

Details: [types/README.md](./types/README.md).

`vite` prints `/{fileName}.dev.user.js` — install that URL once. HMR covers code and styles.

`server.file: true` skips HMR. The same `vite` watch-builds `{fileName}.user.js` (headed IIFE), `{fileName}.js`, and `{fileName}.proxy.user.js` (`@require file://` to the IIFE). Install the printed `/{fileName}.user.js` URL (Firefox-safe). The `Proxy` line is for managers that can poll `file://`. See [examples/serve-file](./examples/serve-file).

> [!IMPORTANT]
> Changing `@match`, `@grant`, or `@name` needs a reinstall.

`vite build` writes `{fileName}.user.js` to `dist/`. One-shot builds do not emit the proxy.

## Multiple scripts

Pass an array of configs. Each item is one full script — no shared `header`.

See [examples/multiple-entries](./examples/multiple-entries).

## Styles

CSS from imports and SFC `<style>` (Vue, Svelte) is collected and injected into the userscript.

```ts
import './style.css'
```

> [!NOTE]
> Do not put userscript assets in `public/` — those URLs hit the host site and 404. Import the file so Vite inlines it.

## HTML pages

`index.html` is a normal Vite app next to the userscript. `vite` serves it at `/`. `vite build` writes it to `dist/` beside `{fileName}.user.js`.

> [!WARNING]
> Keep the page's `<script>` entries distinct from `entry`.

Script metadata: import `virtual:vite-userscript-plugin` (`name`, `version`, `file`).

See [examples/sourcemap](./examples/sourcemap).

## Production

`vite build` writes `{fileName}.user.js` and `{fileName}.meta.js`. `index.html` is written too, when present.

Minify is off (`build.minify`). Sourcemaps are inlined into `.user.js` when `build.sourcemap` is on.

See [examples/sourcemap](./examples/sourcemap).

## Options

`userscript(config)` or `userscript([config, config, …])`. Options are not shared across the array.

| Option | Default | Description |
| --- | --- | --- |
| `entry` | — | Userscript entry. Required. |
| `header` | — | Metablock. Required: `name`, `version`, `match`. Relative `icon` / `require` / `resource` / `supportURL` / `updateURL` / `downloadURL` join `homepage` (`homepageURL` / `website` / `source`). Absolute `http(s):` URLs stay as-is. |
| `fileName` | sanitized `header.name` | Output base name (`{fileName}.user.js`). |
| `server.open` | `false` | Open the install target when Vite starts. HMR: `.dev.user.js`. `file`: `.user.js` URL. |
| `server.prefix` | `'server:'` | Prefix for `@name` in serve mode. `false` disables it. |
| `server.file` | `false` | Watch-build `{fileName}.user.js` + `{fileName}.js` + `{fileName}.proxy.user.js`. Install `.user.js` (or the proxy if `file://` `@require` works). No HMR. |
| `headerAlign` | `1` | Extra spaces after the longest `@key`. `false` — one space. |
| `generate` | — | Rewrite the generated metablock. |
| `autoMetaUrls` | `false` | Fill empty `updateURL` / `downloadURL` from `homepage` / `homepageURL` / `website` / `source`. |
| `metaFile` | `true` | Emit `{fileName}.meta.js`. |

Everything else on `header` follows the manager metablock (`@grant`, `@require`, `@connect`, …).

In serve mode the header lists every grant. In production the plugin scans the bundle and writes only the grants in use. `grant: "none"` disables GM APIs and is never mixed with the scan.

> [!WARNING]
> Keep `metaFile: true` if you use `autoMetaUrls`. Otherwise `@updateURL` points at a file that is not emitted.

## Examples

| Example | What it shows |
| --- | --- |
| [basic](./examples/basic) | Vanilla + SCSS. |
| [react](./examples/react) | JSX, CSS, React refresh. |
| [vue](./examples/vue) | SFC `<style>`, minify, sourcemap. |
| [svelte](./examples/svelte) | SFC `<style>`. |
| [multiple-entries](./examples/multiple-entries) | Two scripts. |
| [sourcemap](./examples/sourcemap) | Inline map, HTML page, virtual module. |
| [serve-file](./examples/serve-file) | `server.file`, install `.user.js` or the proxy from the printed URLs. |

## FAQ

### Scripts fail on Firefox because of CSP

> [!WARNING]
> The host page can block Vite modules from `localhost`. Use a CSP-disable extension, or a browser profile without the site CSP.
>
> https://github.com/Tampermonkey/tampermonkey/issues/952#issuecomment-638373937

### HTTPS site, HTTP Vite — mixed content

> [!WARNING]
> `https://example.com` will not load `http://localhost:5173`. Serve Vite over HTTPS: [`vite-plugin-mkcert`](https://github.com/liuweiGL/vite-plugin-mkcert) before `userscript()`, or `server.https`.

### `public/` assets 404 on the target site

> [!NOTE]
> Userscripts run on someone else’s origin. Import the file so Vite inlines it. `public/` only works for the `index.html` app on the Vite origin.
>
> `@icon`, `@require`, and `@resource` are different: the manager fetches them from the metablock URL, not from the `match` site. Write `icon: 'greasify.svg'` plus `homepage` (GitHub Pages, etc.) — the plugin joins them. Leave `https://…` as-is.

### `@run-at document-start` feels late in dev

> [!NOTE]
> Serve injects `type="module"` (async). Production is a synchronous IIFE unless you use top-level `await`. `server.file` uses that IIFE in dev too.

### `file://` `@require` is blocked

> [!NOTE]
> Firefox extensions cannot read `file://`. Install the printed `{fileName}.user.js` URL instead of the proxy. Tampermonkey on Chromium must allow local file access for the proxy `@require`. Violentmonkey can poll the local IIFE after you install the proxy.

## Migration from v1

| v1 | v2 |
| --- | --- |
| `vite build --watch` | `vite` (HMR) or `vite` + `server.file` |
| `esbuildTransformOptions` | removed |
| `server.port` | Vite `server.port` |
| minify on by default | off; set `build.minify` |
| `*.proxy.user.js` + `file://` | `server.file: true`, or HMR `.dev.user.js` |
| Vite 3–7 | Vite 8 |
| `scripts` + shared `header` | `userscript([config, config, …])` |
| `ScriptOptions` | removed |
| `cssInject` | removed; imported CSS always appends a `<style>` node |
| `align` | `headerAlign` |

## License

[MIT](./LICENCE) © [crashmax](https://github.com/crashmax-dev)
