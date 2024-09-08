import { createButton } from './button.js'
import style from './style.scss?raw'

GM_addStyle(style)

const div = document.querySelector('div')!
div.appendChild(createButton())
