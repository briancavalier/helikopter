import { chain, Fx } from './fx'

export type Stepper<Env, S, T> = (s: S) => Fx<Env, T>

export const loop = <E, S> (sfx: Stepper<E, S, S>): Stepper<E, S, never> =>
  s => chain(loop(sfx), sfx(s))
