import $ from 'jquery'

function createButton(text: string, onClick: () => void) {
  return $('<button type="button">')
    .text(text)
    .on('click', onClick)
}

export function createWidget() {
  let count = 0

  const root = $('<div class="external-cdn-userscript">')
  const title = $('<h1>').text('External CDN userscript')
  const meta = $('<p class="meta">').text(
    `jQuery ${$.fn.jquery} loaded from jsDelivr via @require`,
  )
  const label = $('<p>')
  const actions = $('<div class="actions">')

  const render = () => {
    label.text(`Count: ${count}`)
  }

  const increment = () => {
    count += 1
    render()
  }

  const decrement = () => {
    count -= 1
    render()
  }

  const reset = () => {
    count = 0
    render()
  }

  actions.append(
    createButton('-', decrement),
    createButton('Reset', reset),
    createButton('+', increment),
  )

  root.append(title, meta, label, actions)
  render()

  return root.get(0)!
}
