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
  root.className = 'sourcemap-userscript'

  const title = document.createElement('h1')
  title.textContent = 'Sourcemap userscript'

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

  function boom() {
    console.log(1)

    throw new Error('sourcemap')

    console.log(2)
  }

  actions.append(
    createButton('-', decrement),
    createButton('Reset', reset),
    createButton('+', increment),
    createButton('Throw', boom),
  )

  root.append(title, label, actions)
  render()

  return root
}
