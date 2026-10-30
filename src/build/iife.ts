const SOURCE_MAPPING_URL_RE = /\/\/[#@]\s*sourceMappingURL=\S+/g

export function stripSourceMappingUrl(code: string): string {
  return code.replace(SOURCE_MAPPING_URL_RE, '')
}

export function stripImports(code: string): string {
  return code
    .replace(/(^|[;\n])[ \t]*import\s*(['"])[^'"]+\2\s*;?/g, '$1')
    .replace(/(^|[;\n])[ \t]*import(?![\w$])(?!\s*[.(])(?:\s+type)?\s*[\s\S]*?\s*from\s*["'][^"']+["']\s*;?/g, '$1')
}

export function stripExports(code: string): string {
  return code
    .replace(/\bexport\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["']\s*;?/g, '')
    .replace(/\bexport\s*\*\s*from\s*["'][^"']+["']\s*;?/g, '')
    .replace(/\bexport\s*\{[\s\S]*?\}\s*;?/g, '')
    .replace(/\bexport\s+default\s+/g, '')
    .replace(/\bexport\s+async\s+function/g, 'async function')
    .replace(/\bexport\s+function/g, 'function')
    .replace(/\bexport\s+class/g, 'class')
    .replace(/\bexport\s+(const|let|var)/g, '$1')
}

export function stripDynamicImports(code: string): string {
  return code.replace(
    /\bimport\s*\(\s*(?:\/\*[\s\S]*?\*\/\s*)?["'][^"']+["']\s*\)/g,
    'Promise.resolve({})',
  )
}

export function stripModuleSyntax(code: string): string {
  return stripExports(stripImports(stripDynamicImports(code)))
}

/**
 * First statement of an emitted script.
 * Managers concatenate `@require` in front of the userscript, and comments
 * in the metablock do not end that statement. A require that does not end
 * with `;` would call this script when its first token is `(`.
 */
export const requireStatementGuard = ';\n'

export function isAlreadyIife(code: string): boolean {
  const trimmed = code.trimStart()
  return !/(?:^|\n)\s*(?:import(?![\w$])|export\b)/.test(code)
    && /^\(\s*(?:async\s+)?function\b/.test(trimmed)
}

export function ensureIife(code: string): string {
  const withoutMap = stripSourceMappingUrl(code)
  if (isAlreadyIife(withoutMap)) {
    return withoutMap.endsWith('\n') ? withoutMap : `${withoutMap}\n`
  }

  const stripped = stripModuleSyntax(withoutMap)
  const keyword = /\bawait\b/.test(stripped) ? 'async function' : 'function'
  return `(${keyword} () {\n${stripped}\n})();\n`
}
