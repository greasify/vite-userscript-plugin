import type { EchoRequest, EchoResponse } from './protocol'

addEventListener('message', (event: MessageEvent<EchoRequest>) => {
  const { text } = event.data
  const response: EchoResponse = {
    text,
    reversed: [...text].reverse().join(''),
  }
  postMessage(response)
})
