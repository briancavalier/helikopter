import { Effect, Handler } from './effect'
import { Fiber, fork, kill, select } from './fiber'

export type Update<E, S, A> = [S, ReadonlyArray<Effect<E, A>>]
export type UpdateState<E, S, A> = (s: S, a: A, i: ReadonlyArray<Fiber<A>>) => Update<E, S, A>
export type UpdateView<E, S, A> = (s: S) => Effect<E, A>

export type App<ES, EV, S, A> = {
  updateState: UpdateState<ES, S, A>,
  updateView: UpdateView<EV, S, A>
  state: S,
  effects: ReadonlyArray<Effect<ES, A>>
}

export const run = <E0, E1, S, A> ({ updateState, updateView, state, effects }: App<E0, E1, S, A>, h: Handler<E0 | E1, A>): void =>
  step(updateState, updateView, state, effects, h, [])

const step = <ES, EV, S, A> (updateState: UpdateState<ES, S, A>, updateView: UpdateView<EV, S, A>, state: S, effects: ReadonlyArray<Effect<ES, A>>, h: Handler<ES | EV, A>, inflight: ReadonlyArray<Fiber<A>>): void => {
  const rendering = fork(h, updateView(state));
  const started = effects.map(e => fork(h, e))
  select(fs => {
    fork(h, kill(rendering))
    handleStep(updateState, updateView, state, h, fs)
  }, [...inflight, ...started, rendering])
}

const handleStep = <ES, EV, S, A> (updateState: UpdateState<ES, S, A>, updateView: UpdateView<EV, S, A>, state: S, h: Handler<ES | EV, A>, fs: ReadonlyArray<Fiber<A>>): void => {
  const [actions, pendingFibers] = partition(fs)
  const effects = [] as Effect<ES, A>[]
  for (const a of actions) {
    const [s, e] = updateState(state, a, pendingFibers)
    state = s
    effects.push(...e)
  }
  return step(updateState, updateView, state, effects, h, pendingFibers)
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