import { mount, RedomComponent, unmount } from 'redom'
import { Counter } from './Counter'

class App implements RedomComponent {
  public el: HTMLElement
  public counter: RedomComponent
  public button: HTMLElement

  constructor() {
    this.render()
  }

  private render(): void {
    <div this="el">
      <Counter this="counter" initialCounter={10} />
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
      <a
        href="https://google.com"
        target="_blank"
      >
        This is link
      </a>
    </div>
  }
}

export default new App()
