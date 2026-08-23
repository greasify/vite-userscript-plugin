# vite-userscript-plugin

[![npm](https://img.shields.io/npm/v/vite-userscript-plugin)](https://npmjs.com/vite-userscript-plugin)
[![license](https://img.shields.io/github/license/crashmax-dev/vite-userscript-plugin)](./LICENCE)
[![template](https://img.shields.io/github/package-json/v/crashmax-dev/vite-userscript-template?label=vite-userscript-template)](https://github.com/crashmax-dev/vite-userscript-template)

> A Vite 8 plugin for developing and building Tampermonkey, Greasemonkey and Violentmonkey userscripts.

## Features

- 🔥 Vite HMR
- 🎨 CSS from imports and SFC `<style>`
- 🔧 Configure Userscript header
- 💨 All `@grant`s in the header in dev mode
- 📝 Only used `@grant`s in the production build
- 📦 Built-in types for Tampermonkey, Greasemonkey and Violentmonkey

## Install

Requires **Vite 8** and Node `>=22`.

```bash
pnpm add vite-userscript-plugin -D
```

Put `Userscript()` **last** in `plugins`.

## Setup

```ts
import { defineConfig } from 'vite'
import Userscript from 'vite-userscript-plugin'
import { name, version } from './package.json'

export default defineConfig({
  plugins: [
    Userscript({
      entry: 'src/index.ts',
      header: {
        name,
        version,
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

## Types

Vendored `GM_*` / `GM.*` declarations ship with the plugin. Pick **one** manager — do not mix the three `.d.ts` files.

```json
{
  "compilerOptions": {
    "types": [
      "vite-userscript-plugin/types/tampermonkey"
    ]
  }
}
```

Or a triple-slash reference (what the examples use in `src/vite-env.d.ts`):

```ts
/// <reference types="vite-userscript-plugin/types/tampermonkey" />
```

Replace `tampermonkey` with `greasemonkey` or `violentmonkey` as needed. The APIs are not the same.

Tampermonkey (`GM_*`, sync):

```ts
const visits = GM_getValue('visits', 0)
GM_setValue('visits', visits + 1)

console.log(GM_info.script.name, visits)
```

Greasemonkey (`GM.*`, Promise-based):

```ts
const visits = await GM.getValue('visits', 0)
await GM.setValue('visits', visits + 1)
```

Those identifiers are what the production grant scanner looks for. Sync details: [types/README.md](./types/README.md).

## Development

- `pnpm dev` prints `/{fileName}.dev.user.js`. Open that URL once in the manager.
- Code and SFC style changes go through Vite HMR.
- Changing `@match`, `@grant`, or `@name` needs a reinstall.

## Multiple scripts

Pass an array of the same config shape. There is no shared `header` and no `scripts` key.

See [examples/multiple-entries](./examples/multiple-entries).

```ts
Userscript([
  {
    entry: 'src/foo.ts',
    fileName: 'foo',
    header: {
      name: 'Foo',
      version: '1.0.0',
      match: 'https://a.com/*'
    }
  },
  {
    entry: 'src/bar.ts',
    fileName: 'bar',
    header: {
      name: 'Bar',
      version: '1.0.0',
      match: 'https://b.com/*'
    }
  }
])
```

## Styles

```ts
import './style.css'
```

Vue and Svelte SFC `<style>` work without `?raw`. Use `?raw` + `GM_addStyle` if you want to own the node.

Imported images and `url()` in CSS are inlined. Do not use `public/` — those URLs point at the host site and 404.

## Production

- `vite build` writes `{fileName}.user.js` and `{fileName}.meta.js`.
- Minify is off. Turn it on with Vite `build.minify`.
- The bundle is an IIFE. The manager injects it as a classic script.
- Top-level `await` becomes `(async function () { … })()`.
- With Vite `build.sourcemap`, the map is inlined as a `data:` `sourceMappingURL` at the end of `.user.js`.
- A sibling `.map` file is not written.
- `sourcesContent` keeps your files only. `node_modules` and virtual modules are omitted.
- The map offset includes the metablock and the CSS prelude.

Demo: [examples/sourcemap](./examples/sourcemap).

## Options

`Userscript(config)` or `Userscript([config, config, …])`. Each object is one full script. Options are not shared across the array.

| Option | Default | Description |
| --- | --- | --- |
| `entry` | — | Userscript entry. Required on every config. |
| `header` | — | Metablock. Required: `name`, `version`, `match`. |
| `fileName` | sanitized `header.name` | Output base name (`{fileName}.user.js`). |
| `server.open` | `false` | Open the `.dev.user.js` install URL when Vite starts. |
| `server.prefix` | `'server:'` | Prefix for `@name` in serve mode. `false` disables it. |
| `cssInject` | `'auto'` | How production CSS is injected. |
| `align` | `1` | Extra spaces after the longest `@key`. `false` — one space. |
| `generate` | — | Rewrite the generated metablock. |
| `autoMetaUrls` | `false` | Fill empty `updateURL` / `downloadURL` from a homepage alias. |
| `metaFile` | `true` | Emit `{fileName}.meta.js`. |

### `header`

Required fields: `name`, `version`, `match`. Everything else follows the manager metablock (`@grant`, `@require`, `@connect`, …).

### Grants

In serve mode the header lists every grant so the manager can copy APIs into the page.

In production the plugin scans the bundle for identifiers (`GM_setValue`, `GM.setValue`, `window.focus`, …). Only those grants are written.

`window.focus`, `window.close`, and `window.onurlchange` are real Tampermonkey grants. They are added when those identifiers appear.

`grant: "none"` disables GM APIs. That value is never mixed with auto-detected grants.

### `cssInject`

`'auto'` calls `GM_addStyle` when it exists, otherwise appends a `<style>` node. `@grant GM_addStyle` is added only in this mode.

Pass a function or a JS expression string for a custom injector. The plugin does not add a CSS grant for those.

### `autoMetaUrls` and `metaFile`

When `autoMetaUrls` is on, empty `updateURL` / `downloadURL` are filled from `homepage`, `homepageURL`, `website`, or `source`.

Keep `metaFile: true` if you use that. Otherwise `@updateURL` points at a file that is not emitted.

Demo: [examples/sourcemap](./examples/sourcemap).

### `server`

`open: true` opens the install URL when Vite starts. With several scripts, only those with `open: true` are opened.

`prefix` is prepended to `@name` in serve mode so the dev script does not clash with the installed production one.

### `align` and `generate`

`align` pads `@key` columns. `false` prints a single space.

`generate({ userscript, mode })` rewrites the metablock. `mode` is `serve`, `build`, or `meta`.

## Examples

| Example | What it shows |
| --- | --- |
| [basic](./examples/basic) | Vanilla + SCSS. Minimal `Userscript({ entry, header })`. |
| [react](./examples/react) | JSX, imported CSS, React refresh in dev. |
| [vue](./examples/vue) | SFC `<style>`. This config also sets `minify` and `sourcemap`. |
| [svelte](./examples/svelte) | SFC `<style>`. |
| [multiple-entries](./examples/multiple-entries) | Array of configs, a shared module, two `.user.js` files. |
| [sourcemap](./examples/sourcemap) | Inline map, `autoMetaUrls` + `homepage`. |

## FAQ

### Scripts fail on Firefox because of CSP

The host page can block Vite modules from `localhost`. Use a CSP-disable extension for development, or a browser profile without the site CSP.

- https://github.com/Tampermonkey/tampermonkey/issues/952#issuecomment-638373937

### HTTPS site, HTTP Vite — mixed content

`https://example.com` will not load `http://localhost:5173/@vite/client` or `ws://`. Disable-CSP does not help. Serve Vite over HTTPS.

Easiest: [`vite-plugin-mkcert`](https://github.com/liuweiGL/vite-plugin-mkcert) (trusted local CA). Put it before `Userscript()`:

```ts
import mkcert from 'vite-plugin-mkcert'
import Userscript from 'vite-userscript-plugin'

export default defineConfig({
  plugins: [
    mkcert(),
    Userscript({
      // ...
    })
  ]
})
```

Or pass your own cert to `server.https`:

```ts
import { readFileSync } from 'node:fs'

export default defineConfig({
  server: {
    https: {
      key: readFileSync('./localhost-key.pem'),
      cert: readFileSync('./localhost.pem')
    }
  }
})
```

### Old `file://` proxy scripts

v1 used `{name}.proxy.user.js` and `file://` + “Allow access to file URLs”. Remove those scripts from the manager and install `{name}.dev.user.js` from the Vite URL printed on `vite`.

### `public/` assets 404 on the target site

Userscripts run on someone else’s origin. Files in `public/` are not copied there. Import the file so Vite inlines it as a data URL.

### `@run-at document-start` feels late in dev

Serve injects `type="module"`, which is async.

Production is a synchronous IIFE unless you use top-level `await`. Then the wrapper is `async`, and the first `await` yields a turn.

### Header changes do not hot-reload

`@match`, `@grant`, `@name` live in the installed metablock. Re-open the `.dev.user.js` URL after changing them.

## Migration from v1

| v1 | v2 |
| --- | --- |
| `vite build --watch` | `vite` |
| `esbuildTransformOptions` | removed |
| `server.port` | `server.port` in Vite config |
| minify on production by default | minify off; set `build.minify` |
| `*.proxy.user.js` + `file://` | `*.dev.user.js` from the Vite server |
| Vite 3–7 | Vite 8 |
| `scripts` + a shared `header` | `Userscript([config, config, …])` |
| `ScriptOptions` | removed |

`entry` + `header` is one script. Pass an array of that shape for multiple scripts.

## License

[MIT](./LICENCE) © [crashmax](https://github.com/crashmax-dev)
