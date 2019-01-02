import { Fiber, Fibers, fork, kill, select } from './fiber'
import { Fx, runFx, uncancelable } from './fx'
import { Render, render } from './render'

export type Update<H, S, A> = [S, ReadonlyArray<Fx<H, A>>]
export type UpdateState<H, S, A> = (s: S, a: A, fa: ReadonlyArray<Fiber<A>>) => Update<H, S, A>
export type View<S, V> = (s: S) => V

export type App<H, S, V, A> = {
  update: UpdateState<H, S, A>,
  view: View<S, V>
}

export const run = <H, S, V, A>(app: App<H, S, V, A>, state: S, effects: ReadonlyArray<Fx<H, A>> = []): Fx<H & Fibers & Render<V, A>, never> =>
  env => {
    step(app, state, effects, env, [])
    return uncancelable
  }

const step = <H, S, V, A>(app: App<H, S, V, A>, state: S, effects: ReadonlyArray<Fx<H, A>>, h: H & Fibers & Render<V, A>, pending: ReadonlyArray<Fiber<A>>): void => {
  const rendering = fork(render<V, A>(app.view(state)), h)
  const started = effects.map(fx => fork(fx, h))
  select(fs => {
    runFx(kill(rendering), h)
    handleStep(app, state, h, fs)
  }, ...pending, ...started, rendering)
}

const handleStep = <H, S, V, A>(app: App<H, S, V, A>, state: S, h: H & Fibers & Render<V, A>, fs: ReadonlyArray<Fiber<A>>): void => {
  const [actions, pending] = partition(fs)
  const effects = [] as Fx<H, A>[]
  for (const a of actions) {
    const [s, e] = app.update(state, a, pending)
    state = s
    effects.push(...e)
  }
  return step(app, state, effects, h, pending)
}

const partition = <A> (fs: ReadonlyArray<Fiber<A>>): [ReadonlyArray<A>, ReadonlyArray<Fiber<A>>] => {
  const complete = [] as A[]
  const pending = [] as Fiber<A>[]
  for (const f of fs) {
    if (f.state.status === 0) pending.push(f)
    else if (f.state.status === 1) complete.push(f.state.value)
  }
  return [complete, pending]
}