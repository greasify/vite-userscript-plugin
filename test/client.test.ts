import { expect, it } from 'vitest'
import { createClientSnapshot } from '../src/client.js'
import { resolvePluginConfig } from '../src/resolve.js'

it('createClientSnapshot uses the serve suffix', () => {
  const { scripts } = resolvePluginConfig({
    entry: 'src/main.ts',
    fileName: 'landing-script',
    header: {
      name: 'My Package Name',
      version: '1.2.3',
      match: 'https://example.com/*',
    },
  })

  expect(createClientSnapshot(scripts, 'serve')).toEqual([
    {
      name: 'My Package Name',
      version: '1.2.3',
      file: 'landing-script.dev.user.js',
    },
  ])
})

it('createClientSnapshot uses the build suffix', () => {
  const { scripts } = resolvePluginConfig({
    entry: 'src/main.ts',
    fileName: 'landing-script',
    header: {
      name: 'My Package Name',
      version: '1.2.3',
      match: 'https://example.com/*',
    },
  })

  expect(createClientSnapshot(scripts, 'build')).toEqual([
    {
      name: 'My Package Name',
      version: '1.2.3',
      file: 'landing-script.user.js',
    },
  ])
})

it('createClientSnapshot uses plugin fileName for file, not sanitized header.name', () => {
  const { scripts } = resolvePluginConfig({
    entry: 'src/main.ts',
    fileName: 'custom-landing',
    header: {
      name: 'Not The File Name',
      version: '2.0.0',
      match: 'https://example.com/*',
    },
  })

  const [script] = createClientSnapshot(scripts, 'serve')

  expect(script?.file).toBe('custom-landing.dev.user.js')
  expect(script?.name).toBe('Not The File Name')
  expect(JSON.stringify(script)).not.toContain('fileName')
})

it('createClientSnapshot maps every script', () => {
  const { scripts } = resolvePluginConfig([
    {
      entry: 'src/a.ts',
      fileName: 'alpha',
      header: {
        name: 'Alpha',
        version: '1.0.0',
        match: 'https://a.com/*',
      },
    },
    {
      entry: 'src/b.ts',
      fileName: 'beta',
      header: {
        name: 'Beta',
        version: '2.0.0',
        match: 'https://b.com/*',
      },
    },
  ])

  expect(createClientSnapshot(scripts, 'build')).toEqual([
    {
      name: 'Alpha',
      version: '1.0.0',
      file: 'alpha.user.js',
    },
    {
      name: 'Beta',
      version: '2.0.0',
      file: 'beta.user.js',
    },
  ])
})
