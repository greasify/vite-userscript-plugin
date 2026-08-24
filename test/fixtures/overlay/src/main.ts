function createButton(text: string, onClick: () => void) {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = text
  button.addEventListener('click', onClick)
  return button
}

export function createCounter() {
  function boom() {
    console.log(1)

    throw new Error('sourcemap')

    console.log(2)
  }

  return {
    boom,
    createButton,
  }
}
