import { ActionsOf, EnvOf, Handler, interpret, StateOf, StepOf, UpdateOf, WithEffects } from './handler'
import { Render, render } from './render'
import { Cancel, Fiber, fork, Fx, handle, loop, Reactive, runPure, select } from '@helicopter/core'

export type App<E> = Fx<E, never>

export const runApp = <E> (app: App<E>, env: E): Cancel =>
  runPure(handle(app, env))

export const createApp = <H extends Handler<any, any, any>, V, A extends ActionsOf<H>>(i: H, v: (a: StateOf<H>) => V, a: StateOf<H>, e: ReadonlyArray<Fx<EnvOf<H>, A>> = []): App<EnvOf<H> & Render<V, ActionsOf<H>>> =>
  loop(createReactive(i, v))({ state: a, effects: e, pending: [] })

// Create an App from a Handler and a view function
const createReactive = <H extends Handler<any, any, any>, V>(h: H, v: (a: StateOf<H>) => V): Reactive<EnvOf<H> & Render<V, ActionsOf<H>>, StepOf<H>, StepOf<H>> =>
  ({ state, effects, pending }) => (env, k) => {
    const rendering = fork(handle(render<V, ActionsOf<H>>(v(state)), env))
    const started = effects.map(fx => fork(handle(fx, env)))
    return select(fs => k(handleStep(h, state, fs)), ...pending, ...started, rendering)
  }

const handleStep = <H>(h: H, state: StateOf<H>, fs: ReadonlyArray<Fiber<ActionsOf<H>>>): StepOf<H> => {
  const next = fs.reduce((s, f) => {
    if (f.state.status !== 1 || f.state.value == null) return s

    // TODO: Allow type-specific merging of prev and new State
    // Currently, this only works if State is an object
    const update: UpdateOf<H> = interpret(h, s.state, f.state.value, fs)
    return update instanceof WithEffects
      ? { state: mergeState(s.state, update.value), effects: [...s.effects, ...update.effects] }
      : { state: mergeState(s.state, update), effects: s.effects }
  }, { state, effects: [] as ReadonlyArray<Fx<EnvOf<H>, ActionsOf<H>>> })

  return { ...next, pending: fs.filter(f => f.state.status === 0) }
}

const mergeState = <A>(a0: A, a1: Partial<A>): A =>
  a0 != null && typeof a0 === 'object' ? { ...a0, ...a1 } : a1 as A
