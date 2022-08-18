import { transformWithEsbuild } from 'vite'
import type { ESBuildTransformResult } from 'vite'
import { regexpStyles, template } from './constants.js'

class CSS {
  private styles: string[] = []

  add(entry: string, code: string, path: string): { code: string } | null {
    if (regexpStyles.test(path)) {
      this.styles.push(code)
      return {
        code: ''
      }
    }

    if (path.includes(entry)) {
      return {
        code: code + template
      }
    }

    return null
  }

  async minify(css: string, path: string): Promise<ESBuildTransformResult> {
    return await transformWithEsbuild(css, path, {
      minify: true,
      loader: 'css'
    })
  }

  inject(): string {
    const css = `GM_addStyle(\`${this.styles.join('')}\`)`
    this.styles.length = 0
    return css
  }
}

export default new CSS()
