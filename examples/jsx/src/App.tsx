import { mount, unmount } from 'redom-jsx'
import type { RedomComponent, RedomEl } from 'redom-jsx'
import { Counter } from './Counter.jsx'

export class App implements RedomComponent {
  el: RedomEl

  private counter: RedomComponent
  private button: HTMLElement

  constructor() {
    // prettier-ignore
    <div this="el">
      <Counter
        this="counter"
        initialValue={-10}
      />
      <button
        this="button"
        onclick={() => {
          if (this.counter.el.__redom_mounted) {
            unmount(this.el, this.counter)
          } else {
            mount(this.el, this.counter, this.button)
          }
        }}
      >
        Toggle
      </button>
    </div>
  }
}
