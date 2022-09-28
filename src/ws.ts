function connection() {
  const ws = new WebSocket('__WS__')

  ws.addEventListener('close', () => {
    setTimeout(connection, 1000)
  })

  ws.addEventListener('error', () => {
    ws.close()
  })

  ws.addEventListener('message', () => {
    location.reload()
  })
}

connection()
