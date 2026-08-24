import { createCounter } from './counter'
import './style.css'

if (document.body) {
  document.body.append(createCounter())
}
