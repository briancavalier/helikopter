import { run, Update } from '../../src/app'
import { Cancel, delay, mapTo } from '../../src/effect'
import { Fiber, killWith } from '../../src/fiber'
import { render } from '../../src/render'
import { directive, EventPart, html, Part, render as lrender, TemplateResult } from 'lit-html'

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

const counter = (s: CounterState, a: CounterAction, fs: ReadonlyArray<Fiber<CounterAction>>): Update<{ type: 'delay', ms: number } | never, CounterState, CounterAction> => {
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

const handleRender = <A> (t: TemplateResult, at: Element, k: (a: A) => void): Cancel => {
  const newValues = t.values.map(x => intent(k, x))
  const nt = new TemplateResult(t.strings, newValues, t.type, t.processor)
  const id = requestAnimationFrame(() => lrender(nt, at))
  return () => cancelAnimationFrame(id)
}

const intent = directive((f: (i: any) => void, i: any) => (part: Part) =>
  part.setValue(part instanceof EventPart ? () => f(i) : i))

run({
  updateState: counter,
  updateView: s => render(counterView(s)),
  state: { count: 0, delayed: 0 },
  effects: []
}, (e, k) => {
  switch(e.type) {
    case 'delay':
      const t = setTimeout(k, e.ms)
      return () => clearTimeout(t)
    case 'render':
      return handleRender(e.view, document.body, k)
  }
})
