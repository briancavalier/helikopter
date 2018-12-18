import { complete, createFiber, Fiber, fiberOf } from './fiber'

export type Cancel = () => void

export type Effect<A> = RunEffect<A> | PureEffect<A>

export class RunEffect<A> {
  constructor (public readonly runEffect: (f: (a: A) => void) => Cancel) {}
}

export class PureEffect<A> {
  constructor (public readonly value: A) {}
}

export const fork = <A> (e: Effect<A>): Fiber<A> => {
  if (e instanceof PureEffect) {
    return fiberOf(e.value)
  }

  const fiber = createFiber<A>(() => cancel())
  const cancel = e.runEffect(a => complete(a, fiber))
  return fiber
}

export const effect = <A> (runEffect: (f: (a: A) => void) => Cancel): Effect<A> =>
  new RunEffect(runEffect)

export const pure = <A> (a: A): Effect<A> =>
  new PureEffect(a)

export const mapTo = <A, B> (b: B, e: Effect<A>): Effect<B> =>
  e instanceof PureEffect ? pure(b)
    : effect<B>(f => e.runEffect(_ => f(b)))

export const delay = (ms: number): Effect<void> =>
  effect(f => {
    const t = setTimeout(f, ms)
    return () => clearTimeout(t)
  })
