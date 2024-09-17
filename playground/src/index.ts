import { el } from '@zero-dependency/dom'
import { GM_style } from 'virtual:gm-style'

import { setupCounter } from './counter'

import './style.css'

const style = GM_style('style')
console.log(style)

async function main() {
  const styleUrl = GM_getResourceURL('style')
  const styleElement = el(
    'style',
    { id: 'style', type: 'text/css' },
    atob(styleUrl.slice(21))
  )
  document.head.append(styleElement)

  await new Promise((resolve) => setTimeout(resolve, 500))
  console.log('hello world 123')
  await new Promise((resolve) => setTimeout(resolve, 500))

  setupCounter(document.querySelector('body')!)
}

main()
