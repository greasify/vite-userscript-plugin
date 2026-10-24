const COUNT_KEY = 'count'

function createButton(text: string, onClick: () => void) {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = text
  button.addEventListener('click', onClick)
  return button
}

function readCount() {
  const value = GM_getValue(COUNT_KEY, 0)
  return typeof value === 'number' ? value : 0
}

function notify(text: string) {
  GM_notification(text, GM_info.script.name)
}

export function createWidget() {
  const root = document.createElement('div')
  root.className = 'gm-api-userscript'

  const title = document.createElement('h1')
  title.textContent = 'GM API userscript'

  const meta = document.createElement('p')
  meta.className = 'meta'
  meta.textContent = `${GM_info.script.name} ${GM_info.script.version} via ${GM_info.scriptHandler}`

  const label = document.createElement('p')
  const actions = document.createElement('div')
  actions.className = 'actions'

  const render = () => {
    label.textContent = `Stored count: ${readCount()}`
  }

  const increment = () => {
    GM_setValue(COUNT_KEY, readCount() + 1)
  }

  const reset = () => {
    GM_setValue(COUNT_KEY, 0)
  }

  const copy = () => {
    const text = `count=${readCount()}`
    GM_setClipboard(text)
    notify(`Copied ${text}`)
  }

  GM_addValueChangeListener(COUNT_KEY, (...args) => {
    render()
    if (args[3]) {
      notify('Count changed in another tab')
    }
  })

  GM_registerMenuCommand('Increment count', increment)
  GM_registerMenuCommand('Reset count', reset)
  GM_registerMenuCommand('Copy count', copy)

  actions.append(
    createButton('+', increment),
    createButton('Reset', reset),
    createButton('Copy', copy),
    createButton('Notify', () => notify(`Count is ${readCount()}`)),
  )

  root.append(title, meta, label, actions)
  render()

  return root
}
