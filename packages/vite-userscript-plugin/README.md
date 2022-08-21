# vite-userscript-plugin

![ci](https://img.shields.io/github/workflow/status/crashmax-dev/vite-userscript-plugin/npm-publish)
![npm](https://img.shields.io/npm/v/vite-userscript-plugin)
![license](https://img.shields.io/github/license/crashmax-dev/vite-userscript-plugin)

> Tampermonkey userscript developing and build plugin based on [Vite](https://vitejs.dev).

## Features

- 🔥 Hot reloading after changing any files.
- 🔧 Configure Tampermonkey's Userscript header.
- 💨 Import all `grant` by default in development mode.
- 📝 Automatically add used `grant` when building for production.

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
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { UserscriptPlugin } from 'vite-userscript-plugin'
import { name, version } from './package.json'

export default defineConfig({
  plugins: [
    UserscriptPlugin({
      entry: resolve(__dirname, 'src/index.ts'),
      metadata: {
        name,
        version,
        match: [
          'https://example.com',
          'https://example.org',
          'https://example.edu'
        ]
      }
    })
  ]
})
```

### `package.json`

```json
{
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build"
  }
}
```

## Plugin Configuration

```ts
export interface UserscriptPluginConfig {
  /**
   * Path of userscript entry.
   */
  entry: string

  /**
   * Userscript header config.
   */
  metadata: MetadataConfig

  /**
   * Import all `@grant` in development mode.
   * @default true
   */
  autoGrants?: boolean
}
```

## Example

See the [example](https://github.com/crashmax-dev/vite-userscript-plugin/tree/master/packages/demo) folder.
