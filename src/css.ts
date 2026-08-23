import type { CssInject } from './types.js'

export function escapeCssForTemplate(css: string): string {
  return css
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')
}

const defaultCssInjector = `(function (css) {
  if (typeof GM_addStyle === 'function') {
    GM_addStyle(css)
  } else {
    var style = document.createElement('style')
    style.textContent = css
    ;(document.head || document.documentElement).appendChild(style)
  }
})`

export function createCssInject(
  css: string,
  cssInject: CssInject = 'auto',
): string {
  const payload = JSON.stringify(css)

  if (cssInject === 'auto') {
    return `${defaultCssInjector}(${payload});\n`
  }

  if (typeof cssInject === 'function') {
    return `(${cssInject.toString()})(${payload});\n`
  }

  return `(${cssInject})(${payload});\n`
}
