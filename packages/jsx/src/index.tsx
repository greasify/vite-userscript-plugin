import { mount } from 'redom'
import App from './App.js'

mount(document.body, App)

setInterval(() => {
  App.update()
}, 1000)
