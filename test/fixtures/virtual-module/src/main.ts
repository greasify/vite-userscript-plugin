import { scripts } from 'virtual:vite-userscript-plugin'

document.body?.setAttribute('data-name', scripts[0]?.name ?? '')
console.log(scripts)
