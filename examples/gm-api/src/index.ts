import { createWidget } from './widget'
import './style.css'

if (document.body) {
  document.body.append(createWidget())
}
