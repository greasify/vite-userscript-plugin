import { Router, RedomComponent, mount, unmount, router } from 'redom'
import { Counter } from './Counter'

class H1 implements RedomComponent {
  public el: Router

  constructor() {
    <span this="el">hello</span>
  }
}

class H2 implements RedomComponent {
  public el: Router

  constructor() {
    <span this="el">world</span>
  }
}

class Heading implements RedomComponent {
  public el: Router

  constructor() {
    this.el = router('.heading', {
      h1: H1,
      h2: H2
    }, 'h1')
  }
}

const list = Array.from({ length: 10 }, () => Math.random())

export class App implements RedomComponent {
  public el: HTMLElement
  public counter: RedomComponent
  public button: HTMLElement
  public router: Router

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
          // @ts-ignore
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
      {list.map((value) => {
        return <p>{value}</p>
      })}
      <a
        href="https://google.com"
        target="_blank"
      >
        This is link
      </a>
      <Heading this="router" />
      <button onclick={() => {
        // @ts-ignore
        this.router.el.update(Math.random() < .5 ? 'h1' : 'h2')
      }}>toggle</button>
    </div>
  }
}
