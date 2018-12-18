import { Effect, fork } from './effect'
import { Fiber, kill, select } from './fiber'

export type UpdateState<S, A> = (s: S, a: A, i: ReadonlyArray<Fiber<A>>) => [S, ReadonlyArray<Effect<A>>]
export type UpdateView<S, A> = (s: S) => Effect<A>
export type App<S, A> = { updateState: UpdateState<S, A>, updateView: UpdateView<S, A> }

export const run = <S, A> (app: App<S, A>, state: S, initEffects: ReadonlyArray<Effect<A>> = []): void =>
  step({ ...app, state }, initEffects, [])

type AppState<S, A> = { state: S, updateState: UpdateState<S, A>, updateView: UpdateView<S, A> }

const step = <S, A> (app: AppState<S, A>, effects: ReadonlyArray<Effect<A>>, inflight: ReadonlyArray<Fiber<A>>): void => {
  const rendering = fork(app.updateView(app.state));
  (rendering as any).tag = "rendering"
  const started = effects.map(fork)
  select(fs => {
    fork(kill(rendering))
    handleStep(app, fs)
  }, [...inflight, ...started, rendering])
}

const handleStep = <S, A> (app: AppState<S, A>, fs: ReadonlyArray<Fiber<A>>): void => {
  const [actions, pendingFibers] = partition(fs)
  console.log(pendingFibers)
  const newEffects = [] as Effect<A>[]
  for (const a of actions) {
    const [st, neff] = app.updateState(app.state, a, pendingFibers)
    app.state = st;
    newEffects.push(...neff)
  }
  return step(app, newEffects, pendingFibers)
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