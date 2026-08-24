# Userscript type definitions

[![tampermonkey](https://img.shields.io/npm/v/@types/tampermonkey?label=%40types%2Ftampermonkey)](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/tampermonkey)
[![greasemonkey](https://img.shields.io/npm/v/@types/greasemonkey?label=%40types%2Fgreasemonkey)](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/greasemonkey)
[![violentmonkey](https://img.shields.io/npm/v/@violentmonkey/types?label=%40violentmonkey%2Ftypes)](https://github.com/violentmonkey/types)

Vendored `GM_*` / `GM.*` declarations for Tampermonkey, Greasemonkey and Violentmonkey. Pick one manager — do not mix them in the same project.

Synced versions are recorded in [sources.json](./sources.json).

## Usage

```json
{
  "compilerOptions": {
    "types": [
      "vite-userscript-plugin/types/tampermonkey"
    ]
  }
}
```

```ts
/// <reference types="vite-userscript-plugin/types/tampermonkey" />
```

Replace `tampermonkey` with `greasemonkey` or `violentmonkey` as needed.

## Sync

```sh
pnpm sync-types
```

Copies the latest official `index.d.ts` from npm into this folder. Violentmonkey package-refs (`chrome-types`, `@types/firefox-webext-browser`, …) are rewritten to the local [violentmonkey-ambient.d.ts](./violentmonkey-ambient.d.ts) stub so consumers do not need those packages.
