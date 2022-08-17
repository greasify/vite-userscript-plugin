import { createButton } from './button.js'
import './style.css'
import './style.less'
import './style.sass'

const div = document.querySelector('div')!
div.appendChild(createButton())
