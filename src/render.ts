import { Effect, effect } from './effect'

export type Render<V> = { type: 'render', view: V }

export const render = <V, A> (view: V) : Effect<Render<V>, A> =>
  effect<Render<V>, A>({ type: 'render', view })