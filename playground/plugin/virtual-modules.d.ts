declare module 'virtual:gm-style' {
  function GM_style(name: string): { mount(): void; unmount(): void }
  export { GM_style }
}
