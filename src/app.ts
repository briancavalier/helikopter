import { Fiber, fork, Forked, Fx, loop, Render, render, select, Stepper } from '.'

export type Maybe<A> = A | null

type U2I<U> =
  (U extends any ? (u: U) => void : never) extends ((i: infer I) => void) ? I : never

export class WithEffects<A, E> {
  constructor(public readonly value: A, public readonly effects: E) { }
}

export const withEffects = <A, E>(value: A, effects: E): WithEffects<A, E> =>
  new WithEffects(value, effects)

export type App<E, S, T, A, B = A> = U2I<Interpreters<E, S, T, A, B>>
export type Handler<E, S, A> = App<E, S, S, A, A>
export type PureHandler<S, A> = App<never, S, S, A, A>

export type Interpreters<Env, S, T, A, B> = S extends Op<infer K, infer V> ? Keyed<K, Interpreter<Env, V, T, A, B>> : never
export type Keyed<K, V> = K extends string ? Record<K, V> : never

export type Interpreter<Env, S, T, A, B> = (a: A, s: S, f: ReadonlyArray<Forked>) => Result<Env, T, Partial<B>>
export type Result<Env, T, B> = B | WithEffects<B, ReadonlyArray<Fx<Env, T>>>

export type Op<K, A = void> = { name: K, value: A }
export function op<K extends string, A>(name: K, value: A): Op<K, A>;
export function op<K extends string>(name: K): Op<K, void>;
export function op<K extends string, A>(name: K, value?: A): Op<K, void> | Op<K, A> {
  return value === undefined ? { name, value: undefined } : { name, value }
}

export type EnvOf<I> = U2I<{
  [K in keyof I]: I[K] extends Interpreter<infer E, any, any, any, any> ? E : never
}[keyof I]>
export type StateOf<I> = U2I<{
  [K in keyof I]: I[K] extends (a: infer A, ...rest: any[]) => any ? A : never
}[keyof I]>
export type OpsOf<I> = {
  [K in keyof I]: I[K] extends Interpreter<any, infer S, any, any, any> ? Op<K, S> : never
}[keyof I]

export type Step<E, S, A> = {
  state: S,
  effects: ReadonlyArray<Fx<E, A>>,
  pending: ReadonlyArray<Fiber<A>>
}

export const runApp = <I extends Handler<any, any, any>, V>(i: I, v: (a: StateOf<I>) => V, a: StateOf<I>, e: ReadonlyArray<Fx<EnvOf<I>, OpsOf<I>>> = []): Fx<EnvOf<I> & Render<V, OpsOf<I>>, never> =>
  loop(step(i, v))({ state: a, effects: e, pending: [] })

const step = <I, V>(i: I, v: (a: StateOf<I>) => V): Stepper<EnvOf<I> & Render<V, OpsOf<I>>, Step<EnvOf<I>, StateOf<I>, OpsOf<I>>, Step<EnvOf<I>, StateOf<I>, OpsOf<I>>> =>
  ({ state, effects, pending }) => (env, k) => {
    const rendering = fork(render<V, OpsOf<I>>(v(state)), env)
    const started = effects.map(fx => fork(fx, env))
    return select(fs => k(handleStep(i, state, fs)), ...pending, ...started, rendering)
  }

const handleStep = <I>(i: I, state: StateOf<I>, fs: ReadonlyArray<Fiber<OpsOf<I>>>): Step<EnvOf<I>, StateOf<I>, OpsOf<I>> => {
  const next = fs.reduce((s, f) => {
    if (f.state.status !== 1 || f.state.value == null) return s

    // TODO: Allow type-specific merging of prev and new State
    // Currently, this only works if State is an object
    const update: Result<EnvOf<I>, OpsOf<I>, StateOf<I>> = interpret(i, s.state, f.state.value, fs)
    return update instanceof WithEffects
      ? { state: { ...s.state, ...update.value }, effects: [...s.effects, ...update.effects] }
      : { state: { ...s.state, ...update }, effects: s.effects }
  }, { state, effects: [] as ReadonlyArray<Fx<EnvOf<I>, OpsOf<I>>> })

  return { ...next, pending: fs.filter(f => f.state.status === 0) }
}

const interpret = <I extends Handler<any, any, any>>(i: I, a: StateOf<I>, s: OpsOf<I>, f: ReadonlyArray<Forked>): Result<EnvOf<I>, OpsOf<I>, StateOf<I>> =>
  (i as any)[s.name](a, s.value, f)