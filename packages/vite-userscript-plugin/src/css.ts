import { transformWithEsbuild } from 'vite'
import type { ESBuildTransformResult } from 'vite'

class CSS {
  private css: string[] = []
  private cssTemplate = 'console.warn("__CSS__")'
  private includeCss = new RegExp(/\.css|\.sass|\.scss/)

  get template(): string {
    return this.cssTemplate
  }

  add(entry: string, code: string, file: string): { code: string } | null {
    if (this.includeCss.test(file)) {
      this.css.push(code)
      return {
        code: ''
      }
    }

    if (file.includes(entry)) {
      return {
        code: code + this.cssTemplate
      }
    }

    return null
  }

  async minify(css: string, file: string): Promise<ESBuildTransformResult> {
    return await transformWithEsbuild(css, file, {
      minify: true,
      loader: 'css'
    })
  }

  inject(): string {
    const css = `GM_addStyle(\`${this.css.join('')}\`)`
    this.css.length = 0
    return css
  }
}

export default new CSS()
