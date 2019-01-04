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

type Step<H, S, A> = {
  state: S,
  effects: ReadonlyArray<Fx<H, A>>,
  pending: ReadonlyArray<Fiber<A>>
}

export const run = <H, S, V, A>(app: App<H, S, V, A>, state: S, effects: ReadonlyArray<Fx<H, A>> = []): Fx<H & Fibers & Render<V, A>, never> =>
  env => {
    step(app, { state, effects, pending: [] }, env)
    return uncancelable
  }

const step = <H, S, V, A>(app: App<H, S, V, A>, s: Step<H, S, A>, env: H & Fibers & Render<V, A>): void => {
  const rendering = fork(render<V, A>(app.view(s.state)), env)
  const started = s.effects.map(fx => fork(fx, env))
  select(fs => {
    runFx(kill(rendering), env)
    step(app, handleStep(app, s.state, fs), env)
  }, ...s.pending, ...started, rendering)
}

const handleStep = <H, S, V, A>(app: App<H, S, V, A>, state: S, fs: ReadonlyArray<Fiber<A>>): Step<H, S, A> => {
  return fs.reduce((s, f) => {
    switch (f.state.status) {
      case -1:
        return s
      case 0:
        return { ...s, pending: [...s.pending, f] }
      case 1:
        const [state, effects] = app.update(s.state, f.state.value, fs)
        return { ...s, state, effects: [...s.effects, ...effects] }
    }
  }, { state, effects: [], pending: [] } as Step<H, S, A>)
}
