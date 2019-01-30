import { chain, Fx } from './fx'

// A Reactive takes an A and produces a event B from
// environment E.
export type Reactive<E, A, B> = (a: A) => Fx<E, B>

// A Reactive whose output events are of the same
// type as its input can be tied into a circle.
export type Circular<E, A> = Reactive<E, A, A>

// Loop a Circular forever by feeding output events back
// as input.  The resulting Reactive will perform effects,
// but never produce an output.
export const loop = <E, A>(r: Circular<E, A>): Reactive<E, A, never> =>
  a => chain(loop(r), r(a))
