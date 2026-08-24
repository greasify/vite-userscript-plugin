import { scripts } from 'virtual:vite-userscript-plugin'
import './page.css'

console.log(scripts)

const [script] = scripts
const install = document.querySelector<HTMLAnchorElement>('[data-install]')

if (install && script) {
  install.href = `./${script.file}`
}
