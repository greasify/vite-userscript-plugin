import { regexpStyles, template } from './constants.js'
import { transform } from './helpers.js'

class CSS {
  private readonly styles = new Map<string, string>()

  add(entry: string, code: string, path: string): { code: string } | null {
    if (regexpStyles.test(path)) {
      this.styles.set(path, code)
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

  async minify(file: string, name: string): Promise<string> {
    return await transform({
      file,
      name,
      loader: 'css'
    })
  }

  inject(): string | void {
    const styles = [...this.styles.values()].join('')
    if (!styles) return
    return `GM_addStyle(\`${styles}\`)`
  }

  merge(modules: string[]): void {
    const styleModules: [string, string][] = []

    for (const module of modules) {
      const style = this.styles.get(module)
      if (!style) continue
      styleModules.push([module, style])
    }

    this.styles.clear()
    styleModules.forEach((value) => this.styles.set(...value))
  }
}

export default new CSS()
