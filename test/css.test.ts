import { test, expect } from 'vitest'
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
  await css.add(style1, '/style1.css')
  await css.add(style2, '/style2.css')
  css.merge(['/style2.css'])
  expect(css.inject()).toMatchSnapshot()
})

test('snapshot css modules (undefined)', async () => {
  const css = new CSS()
  await css.add(style1, '/style1.css')
  css.merge([])
  expect(css.inject()).toMatchSnapshot()
})
