import { Action, action, Handler, prop, run, withEffects } from '../../packages/app'
import { Cancel, fibers, Fibers, Fx, kill, runFx } from '../../packages/core'
import { renderLitHtml } from '../../packages/render-lit-html'
import { counter, CounterAction } from '../counter/index'
import { html, TemplateResult } from 'lit-html'
//-------------------------------------------------------
// Notice that we're reusing the counter implementation
// and actions from the simple counter example.  We can
// use the prop lens to adapt it to work in this new app.

// Next, we'll make a separate "delay counter" app, that
// increments the counter after a delay.

// Delaying a computation is an effect.  Let's declare the
// signature and interface for a new Delay effect.  We'll
// supply the implementation later when we run the app.
type Delay = {
  delay: <A> (a: A, ms: number, k: (r: A) => void) => Cancel
}

const delay = <A>(a: A, ms: number): Fx<Delay, A> =>
  ({ delay }, k) => delay(a, ms, k)

// The delay counter can initiate a delay, increment the
// counter after a delay, and cancel all pending delays (i.e.
// those previously initiated, but which have not yet occurred)
type DelayCounterAction =
  | Action<'delay', number>
  | Action<'incDelay'>
  | Action<'cancelDelays'>

// Reuse the counter state, but with a new field to track
// pending delays.
type DelayCount = { count: number, delayed: number }

// Handle the delay counter action.  This handler needs to
// use 2 effects: Delay (which we just defined), and Fibers
// which we can use to kill (cancel) pending delay effects.
const delayCounter: Handler<Delay & Fibers, DelayCounterAction, DelayCount> = {
  delay: (c, ms) =>
    withEffects({ ...c, delayed: c.delayed + 1 }, [delay(action('incDelay'), ms)]),
  incDelay: c =>
    ({ count: c.count + 1, delayed: c.delayed - 1 }),
  cancelDelays: (c, _, delays) =>
    withEffects({ ...c, delayed: 0 }, delays.map(kill))
}

//-------------------------------------------------------
// Now we need a view to display the counter and delays and
// to allow the user to interact.
const view = ({ count, delayed }: DelayCount): TemplateResult => html`
  <p>count: ${count} (delayed: ${delayed})</p>
  <p>
    <button @click=${action('inc')}>+</button>
    <button @click=${action('dec')}>-</button>
    <button @click=${action('reset')} ?disabled=${count === 0}>Reset</button>
  </p>
  <p>
    <button @click=${action('delay', 1000)}>+ Delay</button>
    <button @click=${action('cancelDelays')} ?disabled=${ delayed === 0 }>Cancel Delays</button>
  </p>
`

//------------------------------------------------------
// Compose the counter and delay counter by simply composing
// their handlers.  The counter operates on type number, so
// use can use the prop lens to focus it on the count field
// of DelayCount
const app = { ...prop('count', counter), ...delayCounter }

// Run the app and view, starting with an initial state
const appFx = run(app, view, { count: 0, delayed: 0 })

// Running the app produces 3 effects: Delay (defined above),
// Render (rendering the view is an effect!), and Fibers (for
// canceling pending delays).  To perform the effects,
// we need to supply their implementations.
runFx(appFx, {
  ...fibers,
  ...renderLitHtml<CounterAction | DelayCounterAction>(document.body),
  delay: <A>(a: A, ms: number, k: (r: A) => void): Cancel => {
    const t = setTimeout(k, ms, a)
    return () => clearTimeout(t)
  }
})
