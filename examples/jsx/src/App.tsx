import { Router, mount, router, unmount } from 'redom'
import type { RedomComponent, RedomEl } from 'redom'
import { Counter } from './Counter.js'

class H1 implements RedomComponent {
  public el: RedomEl

  constructor() {
    ;<span this="el">hello</span>
  }
}

class H2 implements RedomComponent {
  public el: RedomEl

  constructor() {
    ;<span this="el">world</span>
  }
}

class Heading {
  public el: Router

  constructor() {
    this.el = router('p.heading', {
      h1: H1,
      h2: H2
    })

    this.el.update('h1')
  }
}

const list = Array.from({ length: 5 }, () => Math.random())

export class App implements RedomComponent {
  public el: RedomEl
  public counter: RedomComponent
  public button: HTMLElement
  public router: Router
  public toggle = true

  constructor() {
    this.render()
  }

  private render(): void {
    ;<div this="el">
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
        mount/unmount counter
      </button>
      <p>
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Illum enim
        veniam id consequatur, dolor recusandae minima dolore ab eius sunt quo
        totam quasi nam? Cum voluptate et id porro odit!
      </p>
      {list.map((value) => (
        <p>{value}</p>
      ))}
      <a
        href="https://google.com"
        target="_blank"
      >
        This is link
      </a>
      <Heading this="router" />
      <button
        onclick={() => {
          this.toggle = !this.toggle
          this.router.el.update!(this.toggle ? 'h1' : 'h2')
        }}
      >
        toggle
      </button>
    </div>
  }
}
