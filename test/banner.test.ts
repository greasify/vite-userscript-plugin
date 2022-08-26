import { expect, test } from 'vitest'
import { banner } from '../src/banner.js'
import { grants } from '../src/constants.js'
import type { Grants, MetadataConfig } from '../src/types.js'

const metadataConfig: MetadataConfig = {
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
  resource: 'https://vitest.dev',
  require: 'https://example.com/index.js',
  grant: grants as unknown as Exclude<Grants, 'GM_addStyle' | 'GM_info'>[],
  match: 'https://vitest.dev',
  'run-at': 'document-start'
}

test('banner snapshot', () => {
  const defaultBanner = banner(metadataConfig)
  expect(defaultBanner).toMatchSnapshot()
})
