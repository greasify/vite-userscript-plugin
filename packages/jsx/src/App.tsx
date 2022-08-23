import { RedomComponent } from 'redom'

const items = Array.from(
  { length: 10 },
  () => Math.random().toString(16).slice(2)
)

class App implements RedomComponent {
  public el: HTMLElement
  public h1: HTMLElement

  constructor() {
    <div this="el">
      <h1 this="h1">Hello World</h1>
      {/* {items.map((item) => (
        <>
          <span>{item}</span>
          <br />
        </>
      ))} */}
      <p className="sefsfe">
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Illum enim
        veniam id consequatur, dolor recusandae minima dolore ab eius sunt quo
        totam quasi nam? Cum voluptate et id porro odit!
      </p>
      <a
        href="https://google.com"
        target="_blank"
      >
        This is button
      </a>
    </div>
  }

  update() {
    this.h1.textContent = Math.random().toString(16)
  }
}

export default new App()
