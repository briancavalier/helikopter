import { ActionsOf, WithEffects, StateOf, UnionStateOf, Handler, EnvOf, Update } from './handler'
import { Forked } from '@helikopter/core'

export const prop = <H extends Handler<any, any, any>, K extends string, S extends Record<K, StateOf<H>>>(k: K, h: H): Handler<EnvOf<H>, ActionsOf<H>, S> =>
  Object.keys(h).reduce((hm, hk) => {
    (hm as any)[hk] = (s: S, a: ActionsOf<H>, fs: ReadonlyArray<Forked>) => {
      const r = (h as any)[hk](s[k], a, fs) as Update<EnvOf<H>, ActionsOf<H>, StateOf<H>>
      return r instanceof WithEffects
        ? new WithEffects({ ...s, [k]: r.value }, r.effects)
        : { ...s, [k]: r }
    }
    return hm
  }, {} as Handler<EnvOf<H>, ActionsOf<H>, S>)
