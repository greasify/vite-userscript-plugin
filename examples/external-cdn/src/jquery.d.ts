/**
 * `jquery` is not a runtime dependency. Types come from `@types/jquery`.
 * The script itself is the CDN `@require` in `vite.config.ts` (`external.jquery`).
 *
 * `import $ from 'jquery'` type-checks against `@types/jquery` (`export = jQuery`).
 * Serve and build map that import to the global `$` from the CDN.
 */
/// <reference types="jquery" />
