import { chain, Fx } from './fx'

// A Reactive takes an A and produces a event B from
// environment E.
export type Reactive<E, A, B> = (a: A) => Fx<E, B>

// A Reactive whose output events are of the same
// type as its input can be tied into a circle by feeding
// output events back as input.  The resulting Reactive
// will recurse forever performing effects, but never
// produce a result.
export const loop = <E, A>(r: Reactive<E, A, A>): Reactive<E, A, never> =>
  a => chain(loop(r), r(a))
