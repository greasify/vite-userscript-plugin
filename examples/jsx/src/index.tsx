import { mount } from 'redom-jsx'

import { App } from './App.js'
import { List } from './List.js'
import { Toggle } from './Toggle.js'

mount(document.body, <App />)
mount(document.body, <Toggle />)
mount(document.body, <List />)
