function createButton(text: string, onClick: () => void) {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = text
  button.addEventListener('click', onClick)
  return button
}

export function createCounter() {
  let count = 0

  const root = document.createElement('div')
  root.className = 'basic-userscript'

  const title = document.createElement('h1')
  title.textContent = 'Basic userscript'

  const label = document.createElement('p')

  const actions = document.createElement('div')
  actions.className = 'actions'

  function render() {
    label.textContent = `Count: ${count}`
  }

  function increment() {
    count += 1
    render()
  }

  function decrement() {
    count -= 1
    render()
  }

  function reset() {
    count = 0
    render()
  }

  actions.append(
    createButton('-', decrement),
    createButton('Reset', reset),
    createButton('+', increment),
  )

  root.append(title, label, actions)
  render()

  return root
}
