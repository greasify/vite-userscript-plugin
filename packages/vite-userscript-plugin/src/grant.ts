import type { Grants } from './types'

class Grant {
  private readonly initialGrants: Grants[] = ['GM_addStyle', 'GM_info']

  merge(grants?: Grants[]) {
    if (Array.isArray(grants)) {
      return [...new Set([...grants, ...this.initialGrants])]
    }

    return this.initialGrants
  }

  GM_info() {
    return `
      const { script } = GM_info
      console.group(script.name + ' / ' + script.version)
      console.log(GM_info)
      console.groupEnd()
    `
  }
}

export default new Grant()
