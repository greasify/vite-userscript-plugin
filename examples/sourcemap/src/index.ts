import { createCounter } from './counter.js'
import './style.css'

if (document.body) {
  document.body.append(createCounter())
}
