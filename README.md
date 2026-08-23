# vite-userscript-plugin

[![npm](https://img.shields.io/npm/v/vite-userscript-plugin)](https://npmjs.com/vite-userscript-plugin)
[![license](https://img.shields.io/github/license/crashmax-dev/vite-userscript-plugin)](./LICENCE)
[![template](https://img.shields.io/github/package-json/v/crashmax-dev/vite-userscript-template?label=vite-userscript-template)](https://github.com/crashmax-dev/vite-userscript-template)

> A Vite 8 plugin for developing and building Tampermonkey / Violentmonkey / Greasemonkey userscripts.

## Features

- 🔥 Vite HMR
- 🎨 CSS from imports and SFC `<style>`
- 🔧 Configure Userscript header
- 💨 All `@grant`s in the header during `vite` / `vite serve`
- 📝 Used `@grant`s only in the production build
- 📦 Built-in types for Tampermonkey / Violentmonkey / Greasemonkey

## Install

Requires **Vite 8** and Node `>=22`.

```bash
pnpm add vite-userscript-plugin -D
```

Put `Userscript()` **last** in `plugins`.

## Setup

```ts
import { defineConfig } from "vite";
import Userscript from "vite-userscript-plugin";
import { name, version } from "./package.json";

export default defineConfig({
  plugins: [
    Userscript({
      entry: "src/index.ts",
      header: {
        name,
        version,
        match: [
          "https://example.com/",
          "https://example.org/"
        ]
      }
    })
  ]
});
```

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

```json
{
  "compilerOptions": {
    "types": [
      "vite-userscript-plugin/types/tampermonkey"
    ]
  }
}
```

`pnpm dev` prints an install URL (`/{fileName}.dev.user.js`). Open it once in the userscript manager. Code and SFC style changes go through Vite HMR. Changes to `@match` / `@grant` / `@name` need a reinstall.

### Multiple scripts

```ts
Userscript({
  header: { author: "you" },
  scripts: [
    {
      entry: "src/foo.ts",
      fileName: "foo",
      header: {
        name: "Foo",
        version: "1.0.0",
        match: "https://a.com/*"
      }
    },
    {
      entry: "src/bar.ts",
      fileName: "bar",
      header: {
        name: "Bar",
        version: "1.0.0",
        match: "https://b.com/*"
      }
    }
  ]
});
```

### Styles

```ts
import "./style.css";
```

Vue / Svelte SFC `<style>` works without `?raw`. `?raw` + `GM_addStyle` still works if you want to manage the node yourself.

Imported images and `url()` in CSS are inlined. Do not use `public/` — those URLs point at the host site and 404.

### Production

`vite build` writes `{fileName}.user.js` and `{fileName}.meta.js`. Minify stays off unless you set `build.minify`. Sourcemaps follow `build.sourcemap`.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `entry` | — | Single-script entry. Mutually exclusive with `scripts`. |
| `scripts` | — | Multiple userscripts from one Vite config. Mutually exclusive with `entry`. |
| `header` | — | Metablock fields. Required `name`, `version`, `match` on each script. With `scripts`, this object is the default merge source. |
| `fileName` | sanitized `header.name` | Output base name (`{fileName}.user.js`). |
| `server.open` | `false` | Open the `.dev.user.js` install URL when Vite starts. |
| `server.prefix` | `'server:'` | Prefix for `@name` in serve mode. Set `false` to disable. |
| `cssInject` | `'auto'` | How production CSS is injected. `'auto'` uses `GM_addStyle` with a `<style>` fallback. Pass a function or source string for a custom injector. |
| `align` | `1` | Extra spaces after the longest `@key`. `false` prints a single space. |
| `generate` | — | Rewrite the generated metablock (`{ userscript, mode }`). |
| `autoMetaUrls` | `false` | Fill empty `updateURL` / `downloadURL` from `homepage`, `homepageURL`, `website`, or `source`. |
| `metaFile` | `true` | Emit `{fileName}.meta.js`. Keep this on when using `autoMetaUrls`. |

Production `@grant`s are detected from identifiers in the bundled code (`GM_setValue`, `GM.setValue`, `window.focus`, …). Serve mode still lists every grant so the manager sandbox can copy APIs into the page. `window.focus` / `window.close` / `window.onurlchange` are real Tampermonkey grants — they are added when those identifiers appear. Set `grant: "none"` to disable GM APIs; that value is never mixed with auto-detected grants.

## FAQ

### Scripts fail on Firefox because of CSP

The host page can block Vite modules from `localhost`. Use a CSP-disable extension for development, or a browser profile without the site CSP.

- https://github.com/Tampermonkey/tampermonkey/issues/952#issuecomment-638373937

### HTTPS site, HTTP Vite — mixed content

`https://example.com` will not load `http://localhost:5173/@vite/client` or `ws://`. Disable-CSP does not help. Serve Vite over HTTPS.

Easiest: [`vite-plugin-mkcert`](https://github.com/liuweiGL/vite-plugin-mkcert) (trusted local CA). Put it before `Userscript()`:

```ts
import mkcert from "vite-plugin-mkcert";
import Userscript from "vite-userscript-plugin";

export default defineConfig({
  plugins: [
    mkcert(),
    Userscript({
      // ...
    })
  ]
});
```

Or pass your own cert to `server.https`:

```ts
import { readFileSync } from "node:fs";

export default defineConfig({
  server: {
    https: {
      key: readFileSync("./localhost-key.pem"),
      cert: readFileSync("./localhost.pem")
    }
  }
});
```

### Old `file://` proxy scripts

v1 used `{name}.proxy.user.js` and `file://` + “Allow access to file URLs”. Remove those scripts from the manager and install `{name}.dev.user.js` from the Vite URL printed on `vite`.

### `public/` assets 404 on the target site

Userscripts run on someone else’s origin. Files in `public/` are not copied there. Import the file so Vite inlines it as a data URL.

### `@run-at document-start` feels late in dev

Serve injects `type="module"`, which is async. Production output is a synchronous IIFE.

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

`entry` + `header` still works as sugar for a single script.

## Examples

See [examples](./examples): `basic`, `react`, `vue`, `svelte`, `multiple-entries`, `sourcemap`.

## License

[MIT](./LICENCE) © [crashmax](https://github.com/crashmax-dev)
