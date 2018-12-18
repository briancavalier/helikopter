import { Cancel, Effect, effect, mapTo, pure, PureEffect } from './effect'

export type Handler<A> = (a: A) => void
export type Unhandle = () => void

export type FiberState<A> =
  | { status: 0, cancel: Cancel, handlers: Handler<Fiber<A>>[] }
  | { status: 1, value: A }
  | { status: -1 }

export class Fiber<A> {
  constructor(public state: FiberState<A>) {}
}

export const createFiber = <A> (cancel: Cancel): Fiber<A> =>
  new Fiber({ status: 0, cancel, handlers: [] })

export const fiberOf = <A> (value: A): Fiber<A> =>
  new Fiber({ status: 1, value })

export const complete = <A> (value: A, f: Fiber<A>): void => {
  if (f.state.status !== 0) return

  const handlers = f.state.handlers
  f.state = { status: 1, value }
  handlers.forEach(h => h(f))
}

export const fork = <A> (e: Effect<A>): Fiber<A> => {
  if (e instanceof PureEffect) return fiberOf(e.value)

  const fiber = createFiber<A>(() => cancel())
  const cancel = e.runEffect(a => complete(a, fiber))
  return fiber
}

export const kill = <A> (f: Fiber<A>): Effect<void> => {
  if (f.state.status !== 0) return pure(undefined)
  else return effect(g => {
    if (f.state.status === 0) {
      const cancel = f.state.cancel
      f.state = { status: -1 }
      cancel()
    }

    g()
    return () => {}
  })
}

export const killWith = <A> (a: A, f: Fiber<A>): Effect<A> =>
  mapTo(a, kill(f))

export const select = <A> (h: Handler<ReadonlyArray<Fiber<A>>>, fs: ReadonlyArray<Fiber<A>>): Unhandle => {
  const ready = fs.some(f => f.state.status !== 0)
  if (ready) {
    h(fs)
    return () => {}
  }

  const wrapped = (_: Fiber<A>) => {
    unhandleAll()
    h(fs)
  }

  const unhandles = fs.map(f => join(wrapped, f))
  const unhandleAll = () => unhandles.forEach(u => u())

  return unhandleAll
}

const join = <A> (h: Handler<Fiber<A>>, f: Fiber<A>): Unhandle => {
  if(f.state.status === -1) return () => {}
  else if(f.state.status === 0) return addToHandlers(h, f.state.handlers)

  h(f)
  return () => {}
}

const addToHandlers = <A> (h: Handler<A>, handlers: Handler<A>[]): Unhandle => {
  handlers.push(h)
  return () => removeFromHandlers(handlers.indexOf(h), handlers)
}

const removeFromHandlers = <A> (i: number, handlers: Handler<A>[]): void => {
  if (i >= 0) handlers.splice(i, 1)
}