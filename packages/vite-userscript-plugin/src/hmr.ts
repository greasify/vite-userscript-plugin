declare const port: number

const ws = new WebSocket(`ws://localhost:${port}`)
ws.addEventListener('message', () => {
  location.reload()
})

ws.addEventListener('open', () => {
  const { script } = GM_info
  console.group(`${script.name} / ${script.version}`)
  console.log(GM_info)
  console.groupEnd()
})
