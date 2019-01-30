import { Action, action, Cancel, fibers, Fibers, Fx, Handler, kill, PureHandler, runApp, runFx, withEffects } from '../../src'
import { renderLitHtml } from '../../src/lit-html-view'
import { html, TemplateResult } from 'lit-html'

//-------------------------------------------------------
// First, let's make a simple, self-contained counter application

// The counter can be incremented, decremented, or reset
type CounterAction = Action<'inc'> | Action<'dec'> | Action<'reset'>

// The counter's current state
type Count = { count: number }

// A handler for the counter actions.  It doesn't perform any
// effects, so it's pure.
const counter: PureHandler<CounterAction, Count> = {
  inc: c => ({ count: c.count + 1 }),
  dec: c => ({ count: c.count - 1 }),
  reset: () => ({ count: 0 })
}

//-------------------------------------------------------
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
type DelayCount = Count & { delayed: number }

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
// their handlers
const app = { ...counter, ...delayCounter }

// Run the app and view, starting with an initial state
const appFx = runApp(app, view, { count: 0, delayed: 0 })

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
