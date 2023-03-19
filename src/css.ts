import { transform } from './helpers.js'

export class CSS {
  private readonly styles = new Map<string, string>()

  async add(code: string, path: string): Promise<string> {
    const style = await transform({
      file: code,
      name: path,
      loader: 'css'
    })

    this.styles.set(path, style.replace('\n', ''))
    return ''
  }

  inject(): string | void {
    if (!this.styles.size) return
    const styles = [...this.styles.values()].join('')
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
    styleModules.forEach((style) => this.styles.set(...style))
  }
}

export default new CSS()
