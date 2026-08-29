import type { Logger } from 'vite'

import { styleText } from 'node:util'
import { FAQ_URL } from '../constants.js'

export function formatInstallLine(installUrl: string): string {
  const coloredUrl = styleText(
    'cyan',
    installUrl.replace(
      /:(\d+)\//,
      (_match, port: string) => `:${styleText('bold', port)}/`,
    ),
  )

  return `  ${styleText('green', '➜')}  ${styleText('bold', 'Userscript')}: ${coloredUrl}`
}

export function formatRebuildLine(elapsedMs: number): string {
  return `${styleText('green', 'Userscript rebuilt')} ${styleText('dim', `(${elapsedMs}ms)`)}`
}

export function formatFaqHint(): string {
  const label = `  ${styleText('green', '➜')}  ${styleText('bold', 'FAQ')}: `
  const link = styleText('cyan', FAQ_URL)

  return `${label}${link}\n`
}

export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex -- ESC prefix of ANSI CSI sequences
  return text.replace(/\u001B\[[0-9;]*m/g, '')
}

export function isViteLocalUrlLine(message: string): boolean {
  return /Local:\s/.test(stripAnsi(message))
}

export function createAfterLocalLogger(info: Logger['info'], localCount: number, onAfterLocal: () => void): { info: Logger['info'], flush: () => void } {
  let remaining = localCount
  let printed = false

  const flush = () => {
    if (printed) {
      return
    }

    printed = true
    onAfterLocal()
  }

  return {
    info: (msg, options) => {
      info(msg, options)

      if (remaining > 0 && isViteLocalUrlLine(String(msg))) {
        remaining -= 1
        if (remaining === 0) {
          flush()
        }
      }
    },
    flush,
  }
}
