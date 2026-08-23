import { expect, it } from 'vitest'

import { GM_NAMESPACE } from '../src/constants.js'
import {
  createGmShimPrelude,
  shimModule,
  shouldShimModule,
} from '../src/gm-shim.js'
import { countBannerLines } from '../src/sourcemap.js'

it('shouldShimModule accepts user JS and framework script modules', () => {
  expect(shouldShimModule('/src/main.ts')).toBe(true)
  expect(shouldShimModule('/src/app.tsx')).toBe(true)
  expect(shouldShimModule('/src/App.vue')).toBe(true)
  expect(shouldShimModule('/src/App.vue?vue&type=script&lang.ts')).toBe(true)
  expect(shouldShimModule('/src/Widget.svelte')).toBe(true)
})

it('shouldShimModule rejects styles, raw queries and node_modules', () => {
  expect(shouldShimModule('/src/style.css')).toBe(false)
  expect(shouldShimModule('/src/style.scss')).toBe(false)
  expect(shouldShimModule('/src/App.vue?vue&type=style&lang.css')).toBe(false)
  expect(shouldShimModule('/src/Widget.svelte?svelte&type=style')).toBe(false)
  expect(shouldShimModule('/src/style.css?raw')).toBe(false)
  expect(shouldShimModule('/node_modules/vue/dist/vue.js')).toBe(false)
})

it('shimModule offsets the sourcemap past the prelude', () => {
  const code = 'console.log(2)\n\nthrow new Error("sourcemap")\n\nconsole.log(1)\n'
  const shimmed = shimModule(code, '/src/counter.ts')
  const throwLine = code.split('\n').findIndex(line => line.includes('throw'))
  const throwColumn = code.split('\n')[throwLine]?.indexOf('throw') ?? 0

  expect(shimmed.code.startsWith(createGmShimPrelude())).toBe(true)
  expect(shimmed.code.endsWith(code)).toBe(true)
  expect(shimmed.map.mappings.startsWith(';'.repeat(countBannerLines(createGmShimPrelude())))).toBe(true)
  expect(shimmed.map.sources).toEqual(['/src/counter.ts'])
  expect(shimmed.map.mappings.split(';')[throwLine + 1]).toContain(',')
  expect(code.split('\n')[throwLine]?.slice(throwColumn)).toContain('throw')
})

it('createGmShimPrelude reads GM APIs from the namespace', () => {
  const prelude = createGmShimPrelude()

  expect(prelude).toContain(`globalThis.${GM_NAMESPACE}`)
  expect(prelude).toContain('GM,')
  expect(prelude).toContain('GM_addStyle')
  expect(prelude).toContain('unsafeWindow')
})
