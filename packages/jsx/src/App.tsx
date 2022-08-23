import { RedomComponent } from 'redom'

class App implements RedomComponent {
  public el: HTMLElement
  public h1: HTMLElement

  constructor() {
    <div this="el">
      <h1 this="h1">Hello World</h1>
      <p className="sefsfe">
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

  update() {
    this.h1.textContent = Math.random().toString(16)
  }
}

export default new App()
