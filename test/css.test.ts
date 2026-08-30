import { expect, it } from 'vitest'

import { createCssInject } from '../src/build/css.js'

it('createCssInject embeds CSS via JSON and uses a style node', () => {
  const css = 'body { content: "`${oops}`" }'
  const injected = createCssInject(css)

  expect(injected).toContain('createElement')
  expect(injected).toContain('textContent')
  expect(injected).not.toContain('GM_addStyle')
  expect(injected).toContain(JSON.stringify(css))
})
