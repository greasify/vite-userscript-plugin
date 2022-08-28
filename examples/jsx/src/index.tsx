import { mount } from 'redom-jsx'
import { App } from './App.jsx'
import { List } from './List.jsx'
import { Toggle } from './Toggle.jsx'

mount(document.body, <App />)
mount(document.body, <Toggle />)
mount(document.body, <List />)
