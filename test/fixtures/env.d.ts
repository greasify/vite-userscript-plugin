/// <reference types="vite/client" />
/// <reference types="svelte" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'fake-jquery' {
  const $: string
  export default $
}

declare module 'fake-vue' {
  export function createApp(): void
}
