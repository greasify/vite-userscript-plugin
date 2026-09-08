export function isWebWorkerRequest(id: string): boolean {
  const queryIndex = id.indexOf('?')
  if (queryIndex === -1) {
    return false
  }

  const query = new URLSearchParams(id.slice(queryIndex + 1))
  return query.has('worker') && !query.has('url')
}

export const webWorkerWrapper = `const dataUri = \`data:text/javascript;charset=utf-8,\${encodeURIComponent(
  \`import \${JSON.stringify(
    new URL('?worker_file&type=module', import.meta['url']).href,
  )};\`,
)}\`;

export default function WorkerWrapper(options) {
  return new Worker(dataUri, {
    type: 'module',
    name: options?.name,
  });
}`
