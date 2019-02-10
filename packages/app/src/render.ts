import { Cancel, Fx } from '@helicopter/core'

export type Render<V, A> = {
  render: (v: V, k: (a: A) => void) => Cancel
}

export const render = <V, A> (view: V) : Fx<Render<V, A>, A> =>
  ({ render }, k) => render(view, k)