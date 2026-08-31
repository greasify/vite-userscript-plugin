import type { Logger } from 'vite'

import { styleText } from 'node:util'
import { FAQ_URL } from '../constants.js'

const INSTALL_LABEL_WIDTH = 'Userscript'.length

function colonPadFor(label: string): string {
  return ' '.repeat(Math.max(0, INSTALL_LABEL_WIDTH - label.length) + 1)
}

function formatLabeledLine(label: string, value: string): string {
  return `  ${styleText('green', '➜')}  ${styleText('bold', label)}:${colonPadFor(label)}${value}`
}

export function alignViteUrlLine(message: string): string {
  return message.replace(
    new RegExp(`(Local(?:\\u001B\\[[0-9;]*m)*:)(\\s+)`),
    (_match, prefix: string) => `${prefix}${colonPadFor('Local')}`,
  )
}

export function formatInstallLine(installUrl: string, label = 'Userscript'): string {
  const coloredUrl = styleText(
    'cyan',
    installUrl.replace(
      /:(\d+)\//,
      (_match, port: string) => `:${styleText('bold', port)}/`,
    ),
  )

  return formatLabeledLine(label, coloredUrl)
}

export function formatRebuildLine(elapsedMs: number): string {
  return `${styleText('green', 'Userscript rebuilt')} ${styleText('dim', `(${elapsedMs}ms)`)}`
}

export function formatFaqHint(): string {
  return `${formatLabeledLine('FAQ', styleText('cyan', FAQ_URL))}\n`
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
      const next = typeof msg === 'string' ? alignViteUrlLine(msg) : msg
      info(next, options)

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
