import { mount } from 'redom-jsx'
import type {
  RedomComponent,
  RedomEl,
  RedomElement,
  RedomProps
} from 'redom-jsx'

interface ItemsProps {
  count: number
}

class Items implements RedomComponent {
  el: RedomEl

  private count: number

  constructor({ count }: RedomProps<ItemsProps>) {
    this.count = count
    this.render()
  }

  update(): void {
    this.el.innerHTML = ''
    mount(this.el, <>{this.generateList()}</>)
  }

  private generateList(): RedomElement[] {
    const list = Array.from({ length: this.count }, () =>
      Math.random().toString(16).slice(2)
    )

    return list.map((value) => (
      <>
        <hr />
        <p>{value}</p>
      </>
    ))
  }

  private render(): void {
    // prettier-ignore
    ;<span this="el">{this.generateList()}</span>
  }
}

export class List implements RedomComponent {
  el: RedomEl

  private items: Items

  constructor() {
    this.render()
  }

  private render(): void {
    // prettier-ignore
    ;<div this="el">
      <h1 this="h1">List</h1>
      <Items this="items" count={5} />
      <button onclick={() => this.items.update()}>Update</button>
    </div>
  }
}
