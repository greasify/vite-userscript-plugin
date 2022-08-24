function HotReload() {
  const ws = new WebSocket('__WS__')

  ws.addEventListener('open', () => {
    const { script } = GM_info
    console.group(`${script.name}@${script.version}`)
    console.log(GM_info)
    console.groupEnd()
  })

  ws.addEventListener('close', () => {
    setTimeout(HotReload, 1000)
  })

  ws.addEventListener('error', () => {
    ws.close()
  })

  ws.addEventListener('message', () => {
    location.reload()
  })
}

HotReload()
