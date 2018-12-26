import { Fiber, Fibers, fork, kill, select } from './fiber'
import { Fx } from './fx'
import { Render, render } from './render'

export type Update<H, S, A> = [S, ReadonlyArray<Fx<H, A>>]
export type UpdateState<H, S, A> = (s: S, a: A, fa: ReadonlyArray<Fiber<A>>) => Update<H, S, A>
export type View<S, V> = (s: S) => V

export type App<H, S, V, A> = {
  update: UpdateState<H, S, A>,
  view: View<S, V>
}

export const run = <H, S, V, A>({ update, view }: App<H, S, V, A>, state: S, effects: ReadonlyArray<Fx<H, A>> = []): Fx<H & Fibers & Render<V, A>, never> =>
  env => {
    step(update, view, state, effects, env, [])
    return () => {}
  }

const step = <H, S, V, A>(update: UpdateState<H, S, A>, view: View<S, V>, state: S, effects: ReadonlyArray<Fx<H, A>>, h: H & Fibers & Render<V, A>, inflight: ReadonlyArray<Fiber<A>>): void => {
  const rendering = fork(render<V, A>(view(state)), h)
  const started = effects.map(fx => fork(fx, h))
  select(fs => {
    fork(kill(rendering), h)
    handleStep(update, view, state, h, fs)
  }, [...inflight, ...started, rendering])
}

const handleStep = <H, S, V, A>(update: UpdateState<H, S, A>, view: View<S, V>, state: S, h: H & Fibers & Render<V, A>, fs: ReadonlyArray<Fiber<A>>): void => {
  const [actions, pendingFibers] = partition(fs)
  const effects = [] as Fx<H, A>[]
  for (const a of actions) {
    const [s, e] = update(state, a, pendingFibers)
    state = s
    effects.push(...e)
  }
  return step(update, view, state, effects, h, pendingFibers)
}

const partition = <A> (fs: ReadonlyArray<Fiber<A>>): [ReadonlyArray<A>, ReadonlyArray<Fiber<A>>] => {
  const aa = [] as A[]
  const fa = [] as Fiber<A>[]
  for (const f of fs) {
    if (f.state.status === 0) fa.push(f)
    else if (f.state.status === 1) aa.push(f.state.value)
  }
  return [aa, fa]
}