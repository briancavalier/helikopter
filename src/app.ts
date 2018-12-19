import { Effect, Handler } from './effect'
import { Fiber, fork, kill, select } from './fiber'
import { Render, render } from './render'

export type Update<E, S, A> = [S, ReadonlyArray<Effect<E, A>>]
export type UpdateState<E, S, A> = (s: S, a: A, i: ReadonlyArray<Fiber<A>>) => Update<E, S, A>
export type View<S, V> = (s: S) => V

export type App<E, S, V, A> = {
  update: UpdateState<E, S, A>,
  view: View<S, V>
  state: S,
  effects: ReadonlyArray<Effect<E, A>>
}

export const run = <E, S, V, A> ({ update, view, state, effects }: App<E, S, V, A>, h: Handler<E | Render<V>, A>): void =>
  step(update, view, state, effects, h, [])

const step = <E, S, V, A> (update: UpdateState<E, S, A>, view: View<S, V>, state: S, effects: ReadonlyArray<Effect<E, A>>, h: Handler<E | Render<V>, A>, inflight: ReadonlyArray<Fiber<A>>): void => {
  const rendering = fork(h, render(view(state)))
  const started = effects.map(e => fork(h, e))
  select(fs => {
    fork(h, kill(rendering))
    handleStep(update, view, state, h, fs)
  }, [...inflight, ...started, rendering])
}

const handleStep = <E, S, V, A> (update: UpdateState<E, S, A>, view: View<S, V>, state: S, h: Handler<E | Render<V>, A>, fs: ReadonlyArray<Fiber<A>>): void => {
  const [actions, pendingFibers] = partition(fs)
  const effects = [] as Effect<E, A>[]
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