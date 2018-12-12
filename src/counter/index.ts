import { delay, Task } from './task'
import { html } from 'lit-html'
import { render } from './lit'
import { run } from './app'

type CounterAction = 'inc' | 'dec' | 'reset' | 'delayinc'

const counterView = (c: number) => html`
  <p>${c}
    <button @click=${'inc'}>+</button>
    <button @click=${'dec'}>-</button>
    <button @click=${'reset'}>Reset</button>
    <button @click=${'delayinc'}>Delay +</button>
  </p>
`

const counter = (s: number, c: CounterAction): [number, ReadonlyArray<Task<CounterAction>>] => {
  switch (c) {
    case 'inc': return [s + 1, []]
    case 'dec': return [s - 1, []]
    case 'reset': return [0, []]
    case 'delayinc':
      return [s, [delay(1000, 'inc' as CounterAction)]]
  }
}

run(counter, s => render(counterView(s), document.body), 0)