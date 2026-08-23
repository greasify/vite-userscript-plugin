import { mount } from 'svelte'

import App from './app.svelte'

if (document.body) {
  mount(App, { target: document.body })
}
