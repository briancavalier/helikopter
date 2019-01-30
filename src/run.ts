import { Fx } from './fx'
import { ActionsOf, EnvOf, Handler, StateOf, step } from './handler'
import { loop } from './reactive'
import { Render } from '.'

export const runApp = <I extends Handler<any, any, any>, V>(i: I, v: (a: StateOf<I>) => V, a: StateOf<I>, e: ReadonlyArray<Fx<EnvOf<I>, ActionsOf<I>>> = []): Fx<EnvOf<I> & Render<V, ActionsOf<I>>, never> =>
  loop(step(i, v))({ state: a, effects: e, pending: [] })
