import { App, run, Update } from '../../src/app'
import { delay, Effect, mapTo } from '../../src/effect'
import { Fiber, killWith } from '../../src/fiber'
import { render } from '../../src/lit'
import { html } from 'lit-html'

type CounterAction = 'inc' | 'dec' | 'reset count' | 'delay' | 'cancel delays' | 'none'

type CounterState = {
  count: number,
  delayed: number
}

const counterView = ({ count, delayed }: CounterState) => html`
  <p>${count} (delayed: ${delayed})</p>
  <p>
    <button @click=${'inc'}>+</button>
    <button @click=${'dec'}>-</button>
    <button @click=${'reset count'} ?disabled=${count === 0}>Reset Count</button>
    <button @click=${'delay'}>Delay +</button>
    <button @click=${'cancel delays'} ?disabled=${delayed === 0}>Cancel Delays</button>
  </p>
`

const counter = (s: CounterState, a: CounterAction, fs: ReadonlyArray<Fiber<CounterAction>>): Update<CounterState, CounterAction> => {
  switch (a) {
    case 'inc': return [{ count: s.count + 1, delayed: fs.length }, []]
    case 'dec': return [{ count: s.count - 1, delayed: fs.length }, []]
    case 'reset count': return [{ count: 0, delayed: fs.length }, []]
    case 'delay':
      const d = mapTo('inc' as CounterAction, delay(1000))
      return [{ ...s, delayed: fs.length + 1 }, [d]]
    case 'cancel delays': return [{ ...s, delayed: 0 }, fs.map(f => killWith('none', f))]
    default: return [s, []]
  }
}

run({
  updateState: counter,
  updateView: s => render(counterView(s), document.body),
  state: { count: 0, delayed: 0 },
  effects: []
})
