import { Effect, effect, Fx } from './effect'

export type Render<V> = Fx<'render', { view: V }>

export const render = <V, A> (view: V) : Effect<Render<V>, A> =>
  effect<Render<V>, A>({ type: 'render', view })