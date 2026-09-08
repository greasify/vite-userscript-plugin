import EchoWorker from './echo.ts?worker'

const worker = new EchoWorker()
worker.postMessage('userscript-worker')
