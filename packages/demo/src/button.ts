export function createButton() {
  const el = document.createElement('button')
  el.textContent = 'Button'
  el.addEventListener('click', () => console.log(import.meta.env))
  return el
}
