class CSS {
  private css: string[] = []
  private cssTemplate = '__CSS_TEMPLATE__'
  private includeCss = new RegExp(/\.css|\.sass|\.scss/)

  get template(): string {
    return this.cssTemplate
  }

  addStyle(entry: string, code: string, id: string): { code: string } | null {
    if (this.includeCss.test(id)) {
      this.css.push(code)
      return {
        code: ''
      }
    }

    if (id.includes(entry)) {
      return {
        code: code + this.cssTemplate
      }
    }

    return null
  }

  inject(): string {
    const css = `GM_addStyle(\`${this.css.join('')}\`)`
    this.css.length = 0
    return css
  }
}

export default new CSS()
