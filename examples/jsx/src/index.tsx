import { mount } from 'redom-jsx'
import { App } from './App.js'
import { ListId } from './ListId.jsx'
import { Toggle } from './Toggle.jsx'

mount(document.body, <App />)
mount(document.body, <Toggle />)
mount(document.body, <ListId />)
