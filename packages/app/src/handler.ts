import { render, Render } from './render'
import { Fiber, fork, Forked, Fx, loop, Reactive, select } from '@helicopter/core'

// Actions represent an intent to change state
export type Action<K, A = void> = {
  readonly name: K,
  readonly value: A
}

export function action<K extends string, A>(name: K, value: A): Action<K, A>;
export function action<K extends string>(name: K): Action<K, void>;
export function action<K extends string, A>(name: K, value?: A): Action<K, void> | Action<K, A> {
  return value === undefined ? { name, value: undefined } : { name, value }
}

// Helper to turn a union into an intersection
type U2I<U> =
  (U extends any ? (u: U) => void : never) extends ((i: infer I) => void) ? I : never

// Readonly key-value pair
export type WithKey<K, V> = K extends string ? Readonly<Record<K, V>> : never

// A Handler is a family of functions which, given an input action A and input sample S,
// produces a new output sample and one or more output actions
export type Handler<E, A, S> = U2I<Interpreters<E, A, A | void, S, S>>
export type PureHandler<A, S> = Handler<never, A, S>

export type Interpreters<E, A, B, S, T> = A extends Action<infer K, infer AV> ? WithKey<K, Interpreter<E, AV, B, S, T>> : never
export type Interpreter<E, A, B, S, T> = (s: S, a: A, f: ReadonlyArray<Forked>) => Update<E, B, T>
export type Update<E, A, S> = S | WithEffects<S, ReadonlyArray<Fx<E, A>>>

export class WithEffects<A, E> {
  constructor(public readonly value: A, public readonly effects: E) { }
}

export const withEffects = <A, E>(value: A, effects: E): WithEffects<A, E> =>
  new WithEffects(value, effects)

export type Step<E, A, S> = {
  readonly state: S,
  readonly effects: ReadonlyArray<Fx<E, A>>,
  readonly pending: ReadonlyArray<Fiber<A>>
}

// Types that recover the environment, state, and actions of a handler
export type EnvOf<I> = U2I<{
  readonly [K in keyof I]: I[K] extends Interpreter<infer E, any, any, any, any> ? E : never
}[keyof I]>
export type StateOf<I> = U2I<{
  readonly [K in keyof I]: I[K] extends (s: infer S, ...rest: any[]) => any ? S : never
}[keyof I]>
export type ActionsOf<I> = {
  readonly [K in keyof I]: I[K] extends Interpreter<any, infer A, any, any, any> ? Action<K, A> : never
}[keyof I]

export type StepOf<I> = Step<EnvOf<I>, ActionsOf<I>, StateOf<I>>
export type UpdateOf<I> = Update<EnvOf<I>, ActionsOf<I>, StateOf<I>>

export const run = <H extends Handler<any, any, any>, V>(i: H, v: (a: StateOf<H>) => V, a: StateOf<H>, e: ReadonlyArray<Fx<EnvOf<H>, ActionsOf<H>>> = []): Fx<EnvOf<H> & Render<V, ActionsOf<H>>, never> =>
  loop(createApp(i, v))({ state: a, effects: e, pending: [] })

// Create an App from a Handler and a view function
export const createApp = <H extends Handler<any, any, any>, V>(h: H, v: (a: StateOf<H>) => V): Reactive<EnvOf<H> & Render<V, ActionsOf<H>>, StepOf<H>, StepOf<H>> =>
  ({ state, effects, pending }) => (env, k) => {
    const rendering = fork(render<V, ActionsOf<H>>(v(state)), env)
    const started = effects.map(fx => fork(fx, env))
    return select(fs => k(handleStep(h, state, fs)), ...pending, ...started, rendering)
  }

const handleStep = <H>(h: H, state: StateOf<H>, fs: ReadonlyArray<Fiber<ActionsOf<H>>>): StepOf<H> => {
  const next = fs.reduce((s, f) => {
    if (f.state.status !== 1 || f.state.value == null) return s

    // TODO: Allow type-specific merging of prev and new State
    // Currently, this only works if State is an object
    const update: UpdateOf<H> = interpret(h, s.state, f.state.value, fs)
    return update instanceof WithEffects
      ? { state: { ...s.state, ...update.value }, effects: [...s.effects, ...update.effects] }
      : { state: { ...s.state, ...update }, effects: s.effects }
  }, { state, effects: [] as ReadonlyArray<Fx<EnvOf<H>, ActionsOf<H>>> })

  return { ...next, pending: fs.filter(f => f.state.status === 0) }
}

const interpret = <H extends Handler<any, any, any>>(i: H, s: StateOf<H>, a: ActionsOf<H>, f: ReadonlyArray<Forked>): UpdateOf<H> =>
  (i as any)[a.name](s, a.value, f)