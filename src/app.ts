import { Fiber, fork, select } from './fiber'
import { Fx } from './fx'
import { Render, render } from './render'
import { loop, SFx } from './run'

export type Maybe<A> = A | void

// Convert Union to Intersection
type U2I<U> =
  (U extends any ? (u: U) => void : never) extends ((i: infer I) => void) ? I : never

export class Update<E, A> {
  constructor (public readonly state: A, public readonly effects: E) {}
}

export const withEffects = <E, S>(state: S, effects: E): Update<E, S> =>
  new Update(state, effects)

// export type Update<E, A> = { state: A, effects?: E }
export type Action<E, P, A, B> = (a: A, p: P) => Update<E, B>

export type Step<H, S, A> = {
  state: S,
  effects: ReadonlyArray<Fx<H, A>>,
  pending: ReadonlyArray<Fiber<A>>
}

export type ActionOf<F> = F extends Action<any, any, any, any> ? F
  : Ret<F> extends Action<any, any, any, any> ? Ret<F>
  : never
export type ActionsOf<I> = Maybe<ActionOf<I[keyof I]>>

export type Arg<F> = F extends (a: infer A, ...rest: any[]) => any ? A : never
export type Ret<F> = F extends (...args: any[]) => infer A ? A : never

export type Fst<P> = P extends Update<any, infer A> ? A : never
export type Snd<P> = P extends Update<infer A, any> ? A : never
export type Env<F> = F extends Fx<infer H, any> ? H : never
export type EnvA<FA> = FA extends ReadonlyArray<infer F> ? Env<F> : never
// type Res<F> = F extends Fx<any, infer R> ? R : never

export type InputOf<A> = U2I<Arg<ActionsOf<A>>>
export type OutputOf<A> = U2I<Fst<Ret<ActionsOf<A>>>>
export type StateOf<A> = InputOf<A> & OutputOf<A>
export type EffectsOf<A> = U2I<EnvA<Snd<Ret<ActionsOf<A>>>>>

export const runApp = <
  App,
  View,
  State extends StateOf<App>,
  Actions extends ActionsOf<App>,
  Effects extends EffectsOf<App> & Render<View, Actions>
>(a: App, v: (a: App, s: State) => View, state: State, effects: Fx<Effects, Actions>[] = []): Fx<Effects, Step<Effects, State, Actions>> =>
  loop(step<App, View, State, Actions, Effects>(a, v), { state, effects, pending: [] })

const step = <
  App,
  View,
  State,
  Actions,
  Effects extends EffectsOf<App> & Render<View, Actions>
>(a: App, v: (a: App, s: State) => View): SFx<Effects, Step<Effects, State, Actions>, Step<Effects, State, Actions>> =>
  ({ state, effects, pending }) => (env, k) => {
    const rendering = fork(render<View, Actions>(v(a, state)), env)
    const started = effects.map(fx => fork(fx, env))
    return select(fs => k(handleStep<State, Actions, Effects>(state, fs)), ...pending, ...started, rendering)
  }

const handleStep = <
  State,
  Actions,
  Effects
>(state: State, fs: ReadonlyArray<Fiber<Actions>>): Step<Effects, State, Actions> => {
  const next = fs.reduce((s, f) => {
    if (f.state.status !== 1 || f.state.value == null) return s

    // TODO: Allow type-specific merging of prev and new State
    // Currently, this only works if State is an object
    const update = (f.state.value as any)(s.state, fs)
    return update instanceof Update
      ? { state: { ...s.state, ...update.state }, effects: [...s.effects, ...update.effects] }
      : { state: { ...s.state, ...update }, effects: s.effects }
  }, { state, effects: [] as ReadonlyArray<Fx<Effects, Actions>> })

  return { ...next, pending: fs.filter(f => f.state.status === 0) }
}