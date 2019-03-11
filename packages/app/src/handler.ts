import { Action, ActionKeys, ActionValue } from './action'
import { Fiber, Forked, Fx } from '@helikopter/core'

export type Handler<E, A, S> = {
  [K in ActionKeys<A>]: (s: S, a: ActionValue<K, A>, f: ReadonlyArray<Forked>) => Update<E, A | void, S>
}

export type PureHandler<A, S> = Handler<never, A, S>

export type Interpreter<E, A, B, S, T> = (s: S, a: A, f: ReadonlyArray<Forked>) => Update<E, B, T>
export type Update<E, A, S> = S | WithEffects<S, ReadonlyArray<Fx<E, A>>>

export class WithEffects<A, E> {
  constructor(public readonly value: A, public readonly effects: E) {}
}

export const withEffects = <A, E>(value: A, effects: E): WithEffects<A, E> =>
  new WithEffects(value, effects)

export const withEffect = <A, E>(value: A, effect: E): WithEffects<A, ReadonlyArray<E>> =>
  new WithEffects(value, [effect])

export type Step<E, A, S> = {
  readonly state: S,
  readonly effects: ReadonlyArray<Fx<E, A>>,
  readonly active: ReadonlyArray<Fiber<A>>
}

// Helper to turn a union into an intersection
type U2I<U> = (U extends any ? (u: U) => void : never) extends ((i: infer I) => void) ? I : never

// Types that recover the environment, state, and actions of a Handler
export type EnvOf<H> = U2I<{
  readonly [K in keyof H]: H[K] extends Interpreter<infer E, any, any, any, any> ? E : never
}[keyof H]>

export type UnionStateOf<H> = {
  readonly [K in keyof H]: H[K] extends (s: infer S, ...rest: any[]) => any ? S : never
}[keyof H]

export type StateOf<H> = U2I<UnionStateOf<H>>

export type ActionsOf<H> = {
  readonly [K in keyof H]: H[K] extends Interpreter<any, infer A, any, any, any> ? Action<K, A> : never
}[keyof H]

export type StepOf<H> = Step<EnvOf<H>, ActionsOf<H>, StateOf<H>>
export type UpdateOf<H> = Update<EnvOf<H>, ActionsOf<H>, StateOf<H>>

export const interpret = <H extends Handler<any, any, any>>(h: H, s: StateOf<H>, a: ActionsOf<H>, f: ReadonlyArray<Forked>): UpdateOf<H> =>
  (h as any)[a.key](s, a.value, f)
