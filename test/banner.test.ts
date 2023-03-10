import { expect, test } from 'vitest'
import { Banner } from '../src/banner.js'
import { grants } from '../src/constants.js'
import type { HeaderConfig } from '../src/types.js'

const defaultBanner: HeaderConfig = {
  name: 'vitest',
  version: '1.0.0',
  author: 'John Doe',
  description: 'vitest',
  namespace: 'vitest',
  connect: 'vitest.dev',
  license: 'MIT',
  noframes: true,
  icon: 'https://vitest.dev/favicon.ico',
  icon64: 'https://vitest.dev/favicon.ico',
  exclude: ['https://vitest.dev/guide/*', 'https://vitest.dev/api/*'],
  include: 'https://vitest.dev',
  homepage: 'https://github.com/vitest-dev/vitest',
  downloadURL: 'https://vitest.dev',
  supportURL: 'https://vitest.dev',
  updateURL: 'https://vitest.dev',
  resource: [['vitest', 'https://vitest.dev']],
  require: 'https://example.com/index.js',
  grant: [...grants],
  match: 'https://vitest.dev',
  'run-at': 'document-start'
}

test('banner default snapshot', () => {
  const banner = new Banner(defaultBanner).generate()
  expect(banner).toMatchSnapshot()
})

const metaBanner: HeaderConfig = {
  name: 'vitest',
  version: '1.0.0',
  match: 'https://example.com',
  homepage: 'https://crashmax-dev.github.io/jsx/'
}

test('banner meta snapshot', () => {
  const banner = new Banner(metaBanner).generate()
  expect(banner).toMatchSnapshot()
})
