import { createCounter } from './counter'
import './style.scss'

await new Promise(resolve => setTimeout(resolve, 1))

if (document.body) {
  document.body.append(createCounter())
}
