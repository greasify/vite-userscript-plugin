import type { RedomComponent, RedomEl, RedomProps } from 'redom-jsx'

interface Props {
  initialValue?: number
}

export class Counter implements RedomComponent {
  el: RedomEl

  private counter: number
  private initialCounter: number
  private interval: ReturnType<typeof setInterval>

  constructor({ initialValue }: RedomProps<Props>) {
    this.initialCounter = initialValue ?? 0
    this.counter = this.initialCounter
    this.render()
  }

  update(): void {
    this.counter++
    this.renderCounter()
  }

  onmount(): void {
    this.renderCounter()
    this.interval = setInterval(() => this.update(), 1000)
  }

  onunmount(): void {
    clearInterval(this.interval)
    this.counter = this.initialCounter
  }

  private renderCounter(): void {
    this.el.textContent = `Count: ${this.counter}`
  }

  private render(): void {
    // prettier-ignore
    ;<h1 this="el"></h1>
  }
}
