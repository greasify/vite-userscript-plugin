import type { HeaderConfig } from './types.js'

export class Banner {
  private header: string[] = []
  private maxKeyLength: number

  constructor(private readonly config: HeaderConfig) {
    this.addHomepageMeta()
    this.maxKeyLength =
      Math.max(...Object.keys(this.config).map((key) => key.length)) + 1
  }

  private addHomepageMeta(): void {
    const homePage = this.config.homepage ?? this.config.homepageURL
    if (homePage) {
      this.config.updateURL = new URL(
        `${this.config.name}.meta.js`,
        homePage
      ).href
      this.config.downloadURL = new URL(
        `${this.config.name}.user.js`,
        homePage
      ).href
    }
  }

  private addSpaces(str: string): string {
    return ' '.repeat(this.maxKeyLength - str.length)
  }

  private addMetadata(
    key: string,
    value: string | string[] | number | boolean
  ): void {
    value = Array.isArray(value) ? value.join(' ') : value === true ? '' : value

    this.header.push(`// @${key}${this.addSpaces(key)}${value}`)
  }

  generate(): string {
    for (const [key, value] of Object.entries(this.config)) {
      if (Array.isArray(value)) {
        value.forEach((value) => this.addMetadata(key, value))
      } else {
        if (value === undefined) continue
        this.addMetadata(key, value)
      }
    }

    return [
      '// ==UserScript==',
      ...this.header,
      '// ==/UserScript=='
    ].join('\n')
  }
}
