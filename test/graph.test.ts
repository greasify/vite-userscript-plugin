import type { OutputBundle, OutputChunk } from '../src/build/bundle.js'
import { expect, it } from 'vitest'
import { collectCss } from '../src/build/css.js'
import {
  inlineImportedChunks,
  rewriteInlinedDynamicImports,
  walkImportedChunks,
} from '../src/build/graph.js'

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
  expect(inlineImportedChunks(entry, bundle)).toContain('export const leaf')
  expect(inlineImportedChunks(entry, bundle)).toContain('export const dyn')
})

it('rewriteInlinedDynamicImports turns import() into Promise.resolve namespaces', () => {
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
  const rewritten = rewriteInlinedDynamicImports(entry.code, entry, { 'dyn.js': dyn })

  expect(rewritten).toContain('Promise.resolve({ label })')
  expect(rewritten).not.toContain('import(')
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
