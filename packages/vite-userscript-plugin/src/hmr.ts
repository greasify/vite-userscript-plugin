function HRM() {
  const ws = new WebSocket('ws://localhost:__PORT__')

  ws.addEventListener('open', () => {
    console.clear()
    const { script } = GM_info
    console.group(`${script.name}@${script.version}`)
    console.log(GM_info)
    console.groupEnd()
  })

  ws.addEventListener('close', () => {
    setTimeout(HRM, 1000)
  })

  ws.addEventListener('error', () => {
    ws.close()
  })

  ws.addEventListener('message', () => {
    location.reload()
  })
}

HRM()
