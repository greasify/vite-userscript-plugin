import { mount } from 'svelte'

import App from './App.svelte'

if (document.body) {
  mount(App, { target: document.body })
}
