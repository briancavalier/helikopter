import { run, Update } from '../../src/app'
import { delay, Delay, mapTo } from '../../src/effect'
import { Fiber, killWith } from '../../src/fiber'
import { handleRender } from '../../src/lit-handler'
import { html } from 'lit-html'

type CounterAction = '+' | '-' | '0' | '+ delay' | '0 delay' | 'none'

type CounterState = {
  count: number,
  delayed: number
}

const counterView = ({ count, delayed }: CounterState) => html`
  <p>${count} (delayed: ${delayed})</p>
  <p>
    <button @click=${'+'}>+</button>
    <button @click=${'-'}>-</button>
    <button @click=${'0'} ?disabled=${count === 0}>Reset Count</button>
    <button @click=${'+ delay'}>Delay +</button>
    <button @click=${'0 delay'} ?disabled=${delayed === 0}>Cancel Delays</button>
  </p>
`

const counter = (s: CounterState, a: CounterAction, fs: ReadonlyArray<Fiber<CounterAction>>): Update<Delay, CounterState, CounterAction> => {
  switch (a) {
    case '+': return [{ count: s.count + 1, delayed: fs.length }, []]
    case '-': return [{ count: s.count - 1, delayed: fs.length }, []]
    case '0': return [{ count: 0, delayed: fs.length }, []]
    case '+ delay':
      const d = mapTo('+' as CounterAction, delay(1000))
      return [{ ...s, delayed: fs.length + 1 }, [d]]
    case '0 delay': return [{ ...s, delayed: 0 }, fs.map(f => killWith('none', f))]
    case 'none': return [s, []]
  }
}

run({
  update: counter,
  view: counterView,
  state: { count: 0, delayed: 0 },
  effects: []
}, (effect, k) => {
  switch(effect.type) {
    case 'delay':
      const t = setTimeout(k, effect.ms)
      return () => clearTimeout(t)
    case 'render':
      return handleRender(effect.view, document.body, k)
  }
})
