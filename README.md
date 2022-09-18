# vite-userscript-plugin

[![npm](https://img.shields.io/npm/v/vite-userscript-plugin)](https://npmjs.com/vite-userscript-plugin)
[![license](https://img.shields.io/github/license/crashmax-dev/vite-userscript-plugin)](./LICENCE)
[![template](https://img.shields.io/github/package-json/v/crashmax-dev/vite-userscript-template?label=vite-userscript-template)](https://github.com/crashmax-dev/vite-userscript-template)

> ⚡️ Tampermonkey userscript developing and build plugin based on [Vite](https://vitejs.dev).

## Features

- 🔥 Hot reloading after changing any files.
- 🔧 Configure Tampermonkey's Userscript header.
- 💨 Import all `grant` by default in development mode.
- 📝 Automatically add used `grant` when building for production.
- 📦 Built-in Tampermonkey's TypeScript type definition.

## Install

```
npm install vite-userscript-plugin -D
```

```
yarn add vite-userscript-plugin -D
```

```
pnpm add vite-userscript-plugin -D
```

## Usage

### `vite.config.ts`

```js
import { defineConfig } from 'vite'
import Userscript from 'vite-userscript-plugin'
import { name, version } from './package.json'

export default defineConfig((config) => {
  return {
    plugins: [
      Userscript({
        entry: 'src/index.ts',
        header: {
          name,
          version,
          match: [
            '*://example.com',
            '*://example.org',
            '*://example.edu'
          ]
        }
      })
    ]
  }
})
```

### `package.json`

```json
{
  "scripts": {
    "dev": "vite build --watch --mode development",
    "build": "vite build"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "types": [
      "vite-userscript-plugin/tampermonkey"
    ]
  }
}
```

## Plugin Configuration

```ts
interface ServerConfig {
    /**
     * {@link https://github.com/sindresorhus/get-port}
     */
    port?: number;
    /**
     * @default false
     */
    open?: boolean;
}

interface UserscriptPluginConfig {
    /**
     * Path of userscript entry.
     */
    entry: string;
    /**
     * Userscript header config.
     */
    header: HeaderConfig;
    /**
     * Server config.
     */
    server?: ServerConfig;
}
```

## Examples

See the [examples](https://github.com/crashmax-dev/vite-userscript-plugin/tree/master/examples) folder.

## License

[MIT](./LICENCE) © [crashmax](https://github.com/crashmax-dev)
