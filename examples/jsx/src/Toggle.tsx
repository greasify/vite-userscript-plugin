import type { RedomComponent, RedomEl } from 'redom-jsx'

import { Heading } from './Heading.js'

export class Toggle implements RedomComponent {
  el: RedomEl

  private heading: Heading

  constructor() {
    // prettier-ignore
    ;<div this="el">
      <Heading this="heading" />
      <button
        onclick={() => {
          this.heading.toggle = !this.heading.toggle
          this.heading.el.update!(this.heading.toggle ? 'h1' : 'h2')
        }}
      >
        Toggle
      </button>
    </div>
  }
}
