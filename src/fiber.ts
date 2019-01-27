import { Cancel, Fx, mapTo, runFx, uncancelable } from './fx'

export type Handler<A> = (a: A) => void
export type Unhandle = () => void

export type FiberState<A> =
  | { status: 0, cancel: Cancel, handlers: Handler<Fiber<A>>[] }
  | { status: 1, value: A }
  | { status: -1 }

export class Fiber<A> {
  constructor(public state: FiberState<A>) {}
}

export type ForkedState =
  | { status: 0, cancel: Cancel }
  | { status: 1 }
  | { status: -1 }

export interface Forked { state: ForkedState }

export const createFiber = <A> (cancel: Cancel): Fiber<A> =>
  new Fiber({ status: 0, cancel, handlers: [] })

export const fiberOf = <A> (value: A): Fiber<A> =>
  new Fiber({ status: 1, value })

export const complete = <A> (value: A, f: Fiber<A>): void => {
  if (f.state.status !== 0) return

  const { handlers } = f.state
  f.state = { status: 1, value }
  handlers.forEach(h => h(f))
}

export const fibers = {
  kill (f: Forked, k: (r: void) => void): Cancel {
    if (f.state.status !== 0) k()
    else {
      const { cancel } = f.state
      f.state = { status: -1 }
      cancel(k)
    }
    return uncancelable
  }
}

export type Fibers = typeof fibers

export const fork = <H, A> (fx: Fx<H, A>, h: H): Fiber<A> => {
  const fiber = createFiber<A>(k => cancel(k))
  const cancel: Cancel = runFx(fx, h,a => complete(a, fiber))
  return fiber
}

export const kill = (f: Forked): Fx<Fibers, void> =>
  ({ kill }, k) => kill(f, k)

export const killWith = <A> (a: A, f: Forked): Fx<Fibers, A> =>
  mapTo(a, kill(f))

export const select = <Fibers extends Fiber<any>[]> (h: Handler<Fibers>, ...fs: Fibers): Unhandle => {
  const ready = fs.some(f => f.state.status === 1)
  if (ready) {
    h(fs)
    return () => {}
  }

  const wrapped: Handler<Fibers[number]> = () => {
    unhandleAll()
    h(fs)
  }

  const unhandles = fs.map(f => join(wrapped, f))
  const unhandleAll = () => unhandles.forEach(u => u())

  return unhandleAll
}

export const join = <A> (h: Handler<Fiber<A>>, f: Fiber<A>): Unhandle => {
  if(f.state.status === -1) return () => {}
  else if(f.state.status === 0) return addToHandlers(h, f.state.handlers)

  h(f)
  return () => {}
}

const addToHandlers = <A> (h: (a: A) => void, handlers: ((a: A) => void)[]): Unhandle => {
  handlers.push(h)
  return () => removeFromHandlers(handlers.indexOf(h), handlers)
}

const removeFromHandlers = <A> (i: number, handlers: ((a: A) => void)[]): void => {
  if (i >= 0) handlers.splice(i, 1)
}