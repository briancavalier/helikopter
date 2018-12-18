import { Effect, fork } from './effect'
import { Fiber, kill, select } from './fiber'

export type UpdateState<S, A> = (s: S, a: A, i: ReadonlyArray<Fiber<A>>) => [S, ReadonlyArray<Effect<A>>]
export type UpdateView<S, A> = (s: S) => Effect<A>
export type Update<S, A> = { state: S, effects: ReadonlyArray<Effect<A>> }
export type App<S, A> = { updateState: UpdateState<S, A>, updateView: UpdateView<S, A> } & Update<S, A>

export const run = <S, A> (app: App<S, A>): void =>
  step(app, [])

const step = <S, A> (app: App<S, A>, inflight: ReadonlyArray<Fiber<A>>): void => {
  const rendering = fork(app.updateView(app.state));
  const started = app.effects.map(fork)
  select(fs => {
    fork(kill(rendering))
    handleStep(app, fs)
  }, [...inflight, ...started, rendering])
}

const handleStep = <S, A> (app: App<S, A>, fs: ReadonlyArray<Fiber<A>>): void => {
  const [actions, pendingFibers] = partition(fs)
  const effects = [] as Effect<A>[]
  let state = app.state
  for (const a of actions) {
    const [s, e] = app.updateState(state, a, pendingFibers)
    state = s
    effects.push(...e)
  }
  return step({ ...app, state, effects }, pendingFibers)
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