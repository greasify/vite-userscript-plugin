addEventListener('message', (event: MessageEvent<string>) => {
  postMessage(event.data)
})
