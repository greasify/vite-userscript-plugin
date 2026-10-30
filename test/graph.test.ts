import type { OutputBundle, OutputChunk } from '../src/build/bundle.js'
import { runInNewContext } from 'node:vm'
import { expect, it } from 'vitest'
import { collectCss } from '../src/build/css.js'
import {
  inlineImportedChunks,
  linkImportedChunks,
  rewriteInlinedDynamicImports,
  walkImportedChunks,
} from '../src/build/graph.js'
import { ensureIife } from '../src/build/iife.js'

function chunk(partial: Partial<OutputChunk> & Pick<OutputChunk, 'fileName' | 'code'>): OutputChunk {
  return {
    type: 'chunk',
    isEntry: false,
    name: partial.fileName.replace(/\.js$/, ''),
    imports: [],
    ...partial,
  }
}

it('walkImportedChunks visits static and dynamic deps in post-order', () => {
  const leaf = chunk({ fileName: 'leaf.js', code: 'export const leaf = 1;\n' })
  const dyn = chunk({
    fileName: 'dyn.js',
    code: 'import { leaf } from "./leaf.js";\nexport const dyn = leaf;\n',
    imports: ['leaf.js'],
    exports: ['dyn'],
  })
  const entry = chunk({
    fileName: 'entry.js',
    code: 'import("./dyn.js")\n',
    isEntry: true,
    imports: [],
    dynamicImports: ['dyn.js'],
  })
  const bundle: OutputBundle = {
    'leaf.js': leaf,
    'dyn.js': dyn,
    'entry.js': entry,
  }

  expect(walkImportedChunks(entry, bundle).map(item => item.fileName)).toEqual([
    'leaf.js',
    'dyn.js',
  ])
  const prelude = inlineImportedChunks(entry, bundle)
  expect(prelude).toContain('__vite_userscript_')
  expect(prelude).toContain('leaf')
  expect(prelude).toContain('dyn')
  expect(prelude).not.toMatch(/\bexport\b/)
})

it('links a dynamic import to the chunk namespace', () => {
  const dyn = chunk({
    fileName: 'dyn.js',
    code: 'export const label = "ok";\n',
    exports: ['label'],
  })
  const entry = chunk({
    fileName: 'entry.js',
    code: 'const { label } = await import("./dyn.js");\n',
    isEntry: true,
    dynamicImports: ['dyn.js'],
  })
  const linked = linkImportedChunks(entry, { 'dyn.js': dyn, 'entry.js': entry })
  const source = `${linked.prelude}${linked.code}`

  expect(source).toMatch(/Promise\.resolve\(__vite_userscript_\d+\)/)
  expect(source).toContain('ok')
  expect(source).not.toContain('import(')
})

it('links minified renamed exports without colliding locals', () => {
  const shared = chunk({
    fileName: 'c.js',
    code: 'function e(){return"inner"}const g="4.0.0";export{g as C,e as k};',
    exports: ['C', 'k'],
  })
  const entry = chunk({
    fileName: 'entry.js',
    code: 'import{C as e}from"./c.js";globalThis.value=e;',
    isEntry: true,
    imports: ['c.js'],
  })
  const linked = linkImportedChunks(entry, { 'c.js': shared, 'entry.js': entry })
  const source = ensureIife(`${linked.prelude}${linked.code}`)
  const sandbox: { value?: string } = {}

  expect(source).not.toMatch(/\b(?:import|export)\b/)
  runInNewContext(source, sandbox)
  expect(sandbox.value).toBe('4.0.0')
})

it('rewriteInlinedDynamicImports keeps a preload stub', () => {
  const rewritten = rewriteInlinedDynamicImports('__vitePreload(() => 1)', {
    chunk: chunk({ fileName: 'entry.js', code: '', isEntry: true }),
    bundle: {},
  })

  expect(rewritten).toContain('function __vitePreload')
})

it('collectCss walks CSS from dynamically imported chunks', () => {
  const dyn = chunk({
    fileName: 'dyn.js',
    code: '',
    viteMetadata: { importedCss: new Set(['dyn.css']) },
  })
  const entry = chunk({
    fileName: 'entry.js',
    code: '',
    isEntry: true,
    dynamicImports: ['dyn.js'],
    viteMetadata: { importedCss: new Set(['entry.css']) },
  })
  const bundle: OutputBundle = {
    'dyn.js': dyn,
    'entry.js': entry,
    'dyn.css': { type: 'asset', source: '.dyn{color:lime}' },
    'entry.css': { type: 'asset', source: '.entry{color:navy}' },
  }

  const { css, files } = collectCss(entry, bundle)
  expect(files).toEqual(['entry.css', 'dyn.css'])
  expect(css).toContain('.entry{color:navy}')
  expect(css).toContain('.dyn{color:lime}')
})
