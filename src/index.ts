import { app } from './app'
import { event, EventSource, Snapshot } from './signal'
import { html } from 'lit-html'
import { LitView, renderLit } from './render-lit-html'
import { taskOf } from './task'

const pipe = <A, B, C> (f: (a: A) => B, g: (b: B) => C): (a: A) => C =>
  a => g(f(a))

type CounterEvents = { inc: EventSource<any>, dec: EventSource<any> }

const counter = (c: number, { inc, dec }: Snapshot<CounterEvents>): [number, {}] => {
  const result = c + (inc ? 1 : 0) - (dec ? 1 : 0)
  return [result, {}]
}

const counterView = (c: number): LitView<CounterEvents> => {
  const inc = event()
  const dec = event()
  const t = html`
    <p>${c}<button @click=${inc}>+</button><button @click=${dec}>-</button></p>
  `
  return [t, { inc, dec }]
}

app(counter, pipe(counterView, renderLit), 0, taskOf({}))
  .run(x => console.log(x))