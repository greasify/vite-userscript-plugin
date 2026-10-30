import { formatVersion } from './shared'

const app = document.querySelector('#app')
if (app) {
  app.textContent = formatVersion('page')
}
