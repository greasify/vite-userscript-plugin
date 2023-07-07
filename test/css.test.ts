import { expect, test } from 'vitest'
import { CSS } from '../src/css.js'

const style1 = `
  body {
    margin: 0;
    padding: 0;
  }

  div {
    padding: 1rem;
  }
`

const style2 = `
  h1 {
    text-decoration: underline;
  }
`

test('snapshot css modules', async () => {
  const css = new CSS()
  await css.add('/style1.css', style1, true)
  await css.add('/style2.css', style2, true)
  css.merge(['/style2.css'])
  expect(css.inject()).toMatchSnapshot()
})

test('snapshot css modules (undefined)', async () => {
  const css = new CSS()
  await css.add('/style1.css', style1, true)
  css.merge([])
  expect(css.inject()).toMatchSnapshot()
})
