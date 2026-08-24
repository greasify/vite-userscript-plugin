const SOURCE_MAPPING_URL_RE = /\/\/[#@]\s*sourceMappingURL=\S+/g

export function stripSourceMappingUrl(code: string): string {
  return code.replace(SOURCE_MAPPING_URL_RE, '')
}

export function stripImports(code: string): string {
  return code
    .replace(/(^|\n)import(?:\s+type)?(?:\s+[\s\S]*?\s+|\s+)from\s*["'][^"']+["']\s*;?/g, '$1')
    .replace(/(^|\n)import\s*["'][^"']+["']\s*;?/g, '$1')
}

export function stripExports(code: string): string {
  return code
    .replace(/^export\s+\{[\s\S]*?\}\s+from\s+["'][^"']+["']\s*;?\s*$/gm, '')
    .replace(/^export\s+\*\s+from\s+["'][^"']+["']\s*;?\s*$/gm, '')
    .replace(/^export\s+\{[\s\S]*?\};?\s*$/gm, '')
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+async\s+function/gm, 'async function')
    .replace(/^export\s+function/gm, 'function')
    .replace(/^export\s+class/gm, 'class')
    .replace(/^export\s+(const|let|var)/gm, '$1')
}

export function stripModuleSyntax(code: string): string {
  return stripExports(stripImports(code))
}

export function isAlreadyIife(code: string): boolean {
  return !/^\s*(?:import|export)\s/m.test(code)
    && /\(\s*(?:async\s+)?function\b/.test(code)
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
