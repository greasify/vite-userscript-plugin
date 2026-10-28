import { expect, it } from 'vitest'
import { createClientSnapshot } from '../src/client.js'
import { resolvePluginConfig } from '../src/resolve.js'

it.each([
  {
    name: 'serve suffix',
    command: 'serve' as const,
    fileName: 'landing-script',
    headerName: 'My Package Name',
    expectedFile: 'landing-script.dev.user.js',
  },
  {
    name: 'file-mode suffix',
    command: 'serve' as const,
    fileName: 'landing-script',
    headerName: 'My Package Name',
    file: true,
    serverFile: true,
    expectedFile: 'landing-script.user.js',
  },
  {
    name: 'build suffix',
    command: 'build' as const,
    fileName: 'landing-script',
    headerName: 'My Package Name',
    expectedFile: 'landing-script.user.js',
  },
  {
    name: 'custom fileName not sanitized header.name',
    command: 'serve' as const,
    fileName: 'custom-landing',
    headerName: 'Not The File Name',
    expectedFile: 'custom-landing.dev.user.js',
  },
])('createClientSnapshot $name', ({ command, fileName, headerName, serverFile, expectedFile }) => {
  const { scripts } = resolvePluginConfig({
    entry: 'src/main.ts',
    fileName,
    header: {
      name: headerName,
      version: '1.2.3',
      match: 'https://example.com/*',
    },
    ...(serverFile ? { server: { file: true } } : {}),
  })

  const [script] = createClientSnapshot(scripts, command)

  expect(script).toEqual({
    name: headerName,
    version: '1.2.3',
    file: expectedFile,
  })
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

it.each([
  {
    name: 'homepage',
    header: { homepage: 'https://example.com/home' },
    expected: 'https://example.com/home',
  },
  {
    name: 'homepageURL',
    header: { homepageURL: 'https://example.com/url' },
    expected: 'https://example.com/url',
  },
  {
    name: 'website',
    header: { website: 'https://example.com/site' },
    expected: 'https://example.com/site',
  },
  {
    name: 'source',
    header: { source: 'https://example.com/source' },
    expected: 'https://example.com/source',
  },
  {
    name: 'homepage over aliases',
    header: {
      homepage: 'https://example.com/home',
      homepageURL: 'https://example.com/url',
      website: 'https://example.com/site',
      source: 'https://example.com/source',
    },
    expected: 'https://example.com/home',
  },
])('createClientSnapshot resolves $name', ({ header, expected }) => {
  const { scripts } = resolvePluginConfig({
    entry: 'src/main.ts',
    fileName: 'demo',
    header: {
      name: 'Demo',
      version: '1.0.0',
      match: 'https://example.com/*',
      ...header,
    },
  })

  expect(createClientSnapshot(scripts, 'build')[0]).toEqual({
    name: 'Demo',
    version: '1.0.0',
    file: 'demo.user.js',
    homepage: expected,
  })
})
