import { createRoot } from 'react-dom/client'

import { App } from './app'
import './style.css'

if (document.body) {
  const root = document.createElement('div')
  document.body.append(root)
  createRoot(root).render(<App />)
}
