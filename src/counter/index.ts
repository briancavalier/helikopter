import { delay, Effect, Fiber } from './effect'
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

const counter = (s: number, a: CounterAction): [number, ReadonlyArray<Effect<CounterAction>>] => {
  switch (a) {
    case 'inc': return [s + 1, []]
    case 'dec': return [s - 1, []]
    case 'reset': return [0, []]
    case 'delayinc':
      const d = delay(1000, 'inc' as CounterAction)
      return [s, [d]]
  }
}

run(counter, s => render(counterView(s), document.body), 0)
