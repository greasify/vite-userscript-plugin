import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, expect, it } from 'vitest'

import { countRequirePrefixLines } from '../src/build/require-offset.js'

const dirs: string[] = []

afterEach(async () => {
  await Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

async function createTree() {
  const root = await mkdtemp(join(tmpdir(), 'require-offset-'))
  dirs.push(root)
  const publicDir = join(root, 'public')
  await mkdir(join(publicDir, 'libs'), { recursive: true })
  return { root, publicDir }
}

it('counts a relative require and a file that does not end with a newline', async () => {
  const { root, publicDir } = await createTree()
  await writeFile(join(publicDir, 'vendor.js'), '!(function () {\n})()')

  expect(countRequirePrefixLines(['vendor.js'], { root, publicDir }, () => {})).toBe(2)
})

it('counts a localhost require by its pathname', async () => {
  const { root, publicDir } = await createTree()
  await writeFile(join(publicDir, 'libs/colorpicker.js'), 'var a = 1\nvar b = 2\n')

  expect(countRequirePrefixLines(
    ['http://localhost:3000/libs/colorpicker.js'],
    { root, publicDir },
    () => {},
  )).toBe(2)
})

it('counts a file url and warns once for a remote require', async () => {
  const { root, publicDir } = await createTree()
  const outside = join(root, 'outside.js')
  await writeFile(outside, 'var outside = true\n')

  const warnings: string[] = []
  const lines = countRequirePrefixLines(
    ['https://cdn.example/lib.js', 'https://cdn.example/lib.js', pathToFileURL(outside).href],
    { root, publicDir },
    message => warnings.push(message),
  )

  expect(lines).toBe(1)
  expect(warnings).toHaveLength(1)
  expect(warnings[0]).toContain('https://cdn.example/lib.js')
})
