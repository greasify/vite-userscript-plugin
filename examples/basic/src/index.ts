import { createButton } from './button.js'
import './styles/style.css'
import './styles/style.sass'

const div = document.querySelector('div')!
div.appendChild(createButton())
