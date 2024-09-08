import { router } from 'redom-jsx'
import type { RedomComponent, RedomEl, Router } from 'redom-jsx'

class H1 implements RedomComponent {
  el: RedomEl

  constructor() {
    // prettier-ignore
    ;<h1 this="el">Lorem ipsum dolor sit amet. (h1)</h1>
  }
}

class H2 implements RedomComponent {
  el: RedomEl

  constructor() {
    // prettier-ignore
    ;<h2 this="el">Lorem ipsum dolor sit amet. (h2)</h2>
  }
}

export class Heading {
  el: Router
  toggle = true

  constructor() {
    this.el = router('span', {
      h1: H1,
      h2: H2
    })

    this.el.update('h1')
  }
}
