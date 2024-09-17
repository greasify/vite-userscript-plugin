import { el } from '@zero-dependency/dom'
import { GM_style } from 'virtual:gm-style'

// import styleName from './counter.css?name'
import './counter.css'

// import './styles/counter.css'

export function setupCounter(target: HTMLElement) {
  let count = 0

  const counter = el('button', {
    onclick: () => setCounter(++count)
  })

  const style = GM_style('styleName')

  const setCounter = (count: number) => {
    if (count % 2 === 0) {
      style.mount()
    } else {
      style.unmount()
    }

    counter.textContent = `count is ${count}`
  }

  setCounter(count)
  target.append(counter)
}
