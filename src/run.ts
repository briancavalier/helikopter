import { chain, Fx } from './fx'

export type SFx<Env, S, T> = (s: S) => Fx<Env, T>

export const loop = <Env, S>(app: SFx<Env, S, S>, s: S): Fx<Env, S> =>
  chain(s => loop(app, s), app(s))
