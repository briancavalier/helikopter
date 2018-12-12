import { Effect, Fiber, joinFiber, select } from './effect'

export type UpdateState<S, A> = (s: S, a: A, i: ReadonlyArray<Fiber<A>>) => [S, ReadonlyArray<Effect<A>>]
export type UpdateView<S, A> = (s: S) => Effect<A>
export type App<S, A> = { state: S, updateState: UpdateState<S, A>, updateView: UpdateView<S, A> }

export const run = <S, A> (updateState: UpdateState<S, A>, updateView: UpdateView<S, A>, state: S): void =>
  step({ updateState, updateView, state }, [], [])

const step = <S, A> (app: App<S, A>, effects: ReadonlyArray<Effect<A>>, fibers: ReadonlyArray<Fiber<A>>): void => {
  const renderEffect: Effect<A> = app.updateView(app.state)
  const newFibers = [renderEffect, ...effects].map(e => e.runEffect())
  return select(fs => handleStep(app, fs), [...fibers, ...newFibers])
}

const handleStep = <S, A> (app: App<S, A>, fs: ReadonlyArray<Fiber<A>>): void => {
  const [actions, pendingFibers] = partition(fs)
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