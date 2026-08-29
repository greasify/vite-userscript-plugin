/// <reference types="vite/client" />
/// <reference types="vite-userscript-plugin/virtual" />
/// <reference types="vite-userscript-plugin/types/tampermonkey" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<object, object, unknown>
  export default component
}
