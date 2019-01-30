import { chain, Fx } from './fx'

// A Reactive takes an A and produces a event B from
// environment E.
export type Reactive<E, A, B> = (a: A) => Fx<E, B>

export const loop = <E, A>(r: Reactive<E, A, A>): Reactive<E, A, never> =>
  a => chain(loop(r), r(a))
