import type { EchoRequest, EchoResponse } from './protocol'
import EchoWorker from './echo.ts?worker&inline'

function createButton(text: string, onClick: () => void) {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = text
  button.addEventListener('click', onClick)
  return button
}

export function createWidget() {
  const worker = new EchoWorker({ name: 'echo' })

  const root = document.createElement('div')
  root.className = 'web-worker-userscript'

  const title = document.createElement('h1')
  title.textContent = 'Web Worker userscript'

  const meta = document.createElement('p')
  meta.className = 'meta'
  meta.textContent = 'Reverses text in a module worker (`?worker&inline`)'

  const input = document.createElement('input')
  input.type = 'text'
  input.value = 'userscript'
  input.setAttribute('aria-label', 'Text to reverse')

  const log = document.createElement('ol')
  log.className = 'log'
  log.setAttribute('aria-live', 'polite')

  const appendLog = (text: string) => {
    const item = document.createElement('li')
    item.textContent = text
    log.append(item)
  }

  const send = () => {
    const text = input.value.trim()
    if (!text) return

    const request: EchoRequest = {
      text,
    }
    worker.postMessage(request)
  }

  worker.addEventListener('message', (event: MessageEvent<EchoResponse>) => {
    const { text, reversed } = event.data
    appendLog(`${text} → ${reversed}`)
  })

  worker.addEventListener('error', () => {
    appendLog('Worker failed to start')
  })

  const actions = document.createElement('div')
  actions.className = 'actions'
  actions.append(input, createButton('Reverse', send))

  root.append(title, meta, actions, log)
  return root
}
