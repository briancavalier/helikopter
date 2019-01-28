import {
  Action,
  action,
  App,
  Cancel,
  fibers,
  Fibers,
  Fx,
  kill,
  PureHandler,
  runApp,
  runFx,
  withEffects
  } from '../../src'
import { renderLitHtml } from '../../src/lit-html-view'
import { html, TemplateResult } from 'lit-html'

type CountOp = Action<'inc'> | Action<'dec'> | Action<'reset'>

type Count = { count: number }

const counter: PureHandler<CountOp, Count> = {
  inc: c => ({ count: c.count + 1 }),
  dec: c => ({ count: c.count - 1 }),
  reset: () => ({ count: 0 })
}

//-------------------------------------------------------
type DelayCountOp =
  | Action<'delay', number>
  | Action<'incDelay'>
  | Action<'cancelDelays'>

type DelayedCount = Count & { delayed: number }

const delayCounter: App<Delay & Fibers, DelayCountOp, DelayCountOp | void, DelayedCount> = {
  delay: (c, ms) =>
    withEffects({ delayed: c.delayed + 1 }, [delay(action('incDelay'), ms)]),
  incDelay: c =>
    ({ count: c.count + 1, delayed: c.delayed - 1 }),
  cancelDelays: (c, _, delays) =>
    withEffects({ delayed: 0 }, delays.map(kill))
}

type Delay = {
  delay: <A> (a: A, ms: number, k: (r: A) => void) => Cancel
}

const delay = <A>(a: A, ms: number): Fx<Delay, A> =>
  ({ delay }, k) => delay(a, ms, k)

//-------------------------------------------------------
// A view that uses capabilities of counter, and delayCounter
const view = ({ count, delayed }: DelayedCount): TemplateResult => html`
  <p>count: ${count} (delayed: ${delayed})</p>
  <p>
    <button @click=${() => action('inc')}>+</button>
    <button @click=${() => action('dec')}>-</button>
    <button @click=${() => action('reset')} ?disabled=${count === 0}>Reset</button>
  </p>
  <p>
    <button @click=${()=> action('delay', 1000)}>+ Delay</button>
    <button @click=${()=> action('cancelDelays')} ?disabled=${ delayed === 0 }>Cancel Delays</button>
  </p>
`

//------------------------------------------------------
const app = {...counter, ...delayCounter}

const appFx = runApp(app, view, { count: 0, delayed: 0 })

runFx(appFx, {
  ...fibers,
  ...renderLitHtml<CountOp | DelayCountOp>(document.body),
  delay: <A>(a: A, ms: number, k: (r: A) => void): Cancel => {
    const t = setTimeout(k, ms, a)
    return () => clearTimeout(t)
  }
})
