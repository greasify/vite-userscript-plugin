import { scripts } from 'virtual:vite-userscript-plugin'

const app = document.querySelector('#app')
if (app) {
  app.textContent = scripts[0]?.file ?? ''
}
