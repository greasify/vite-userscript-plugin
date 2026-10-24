import { runInNewContext } from 'node:vm'

// A @require IIFE with no trailing semicolon. The next script must not be
// parsed as its argument.
const requiredWithoutSemicolon = '!(function (window, document) {\n})(window, document)\n'

function createDocument() {
  return {
    createElement: () => ({ style: {} }),
    head: { appendChild() {} },
    documentElement: { appendChild() {} },
    body: { setAttribute() {} },
  }
}

export function runAfterRequire(source: string) {
  const document = createDocument()
  const window = { document }

  return runInNewContext(`${requiredWithoutSemicolon}${source}`, { window, document })
}
