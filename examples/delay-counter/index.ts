import {
  App,
  Cancel,
  fibers,
  Fibers,
  Fx,
  kill,
  op,
  Op,
  PureHandler,
  runApp,
  runFx,
  withEffects
  } from '../../src'
import { renderLitHtml } from '../../src/lit-html-view'
import { html, TemplateResult } from 'lit-html'

type CountOp = Op<'inc'> | Op<'dec'> | Op<'reset'>

type Count = { count: number }

const counter: PureHandler<CountOp, Count> = {
  inc: c => ({ count: c.count + 1 }),
  dec: c => ({ count: c.count - 1 }),
  reset: () => ({ count: 0 })
}

//-------------------------------------------------------
type DelayCountOp =
  | Op<'delay', number>
  | Op<'incDelay'>
  | Op<'cancelDelays'>

type DelayedCount = Count & { delayed: number }

const delayCounter: App<Delay & Fibers, DelayCountOp, DelayCountOp | void, DelayedCount> = {
  delay: (c, ms) =>
    withEffects({ delayed: c.delayed + 1 }, [delay(op('incDelay'), ms)]),
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
    <button @click=${() => op('inc')}>+</button>
    <button @click=${() => op('dec')}>-</button>
    <button @click=${() => op('reset')} ?disabled=${count === 0}>Reset</button>
  </p>
  <p>
    <button @click=${()=> op('delay', 1000)}>+ Delay</button>
    <button @click=${()=> op('cancelDelays')} ?disabled=${ delayed === 0 }>Cancel Delays</button>
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
