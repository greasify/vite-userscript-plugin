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
