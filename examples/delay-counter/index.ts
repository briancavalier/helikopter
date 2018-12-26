import { Cancel, Fiber, Fibers, fibers, Fx, killWith, mapTo, run, runFx, Update } from '../../src'
import { renderLitHtml } from '../../src/lit-handler'
import { html, TemplateResult } from 'lit-html'

type CounterAction = '+' | '-' | '0' | '+ delay' | '0 delay' | 'none'

type CounterState = { count: number, delayed: number }

const counterView = ({ count, delayed }: CounterState): TemplateResult => html`
  <p>${count} (delayed: ${delayed})</p>
  <p>
    <button @click=${'+'}>+</button>
    <button @click=${'-'}>-</button>
    <button @click=${'0'} ?disabled=${count === 0}>Reset Count</button>
    <button @click=${'+ delay'}>Delay +</button>
    <button @click=${'0 delay'} ?disabled=${delayed === 0}>Cancel Delays</button>
  </p>
`

const counter = (s: CounterState, a: CounterAction, fs: ReadonlyArray<Fiber<CounterAction>>): Update<Delay & Fibers, CounterState, CounterAction> => {
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

type Delay = {
  delay: (ms: number, k: (r: void) => void) => Cancel
}

const delay = (ms: number): Fx<Delay, void> =>
  ({ delay }, k) => delay(ms, k)

const app = run({ update: counter, view: counterView }, { count: 0, delayed: 0 })

runFx(app, {
  ...fibers,
  ...renderLitHtml<CounterAction>(document.body),
  delay: (ms: number, k: (r: void) => void): Cancel => {
    const t = setTimeout(k, ms)
    return () => clearTimeout(t)
  }
})
