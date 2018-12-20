import { Cancel, Fx, mapTo, runFx } from './fx'

const noop = () => {}

export type Unhandle = () => void

export type FiberState<A> =
  | { status: 0, cancel: Cancel, handlers: ((f: Fiber<A>) => void)[] }
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

  const { handlers } = f.state
  f.state = { status: 1, value }
  handlers.forEach(h => h(f))
}

export const fork = <H, A> (fx: Fx<H, A>, h: H): Fiber<A> => {
  const fiber = createFiber<A>(() => cancel())
  const cancel: Cancel = runFx(fx, h, a => complete(a, fiber))
  return fiber
}

export const kill = <A> (f: Fiber<A>): Fx<unknown, void> =>
  (_, k) => {
    if (f.state.status === 0) {
      const { cancel } = f.state
      f.state = { status: -1 }
      cancel()
    }

    k(undefined)
    return noop
  }

export const killWith = <A> (a: A, f: Fiber<A>): Fx<unknown, A> =>
  mapTo(a, kill(f))

export const select = <A> (h: (fs: ReadonlyArray<Fiber<A>>) => void, fs: ReadonlyArray<Fiber<A>>): Unhandle => {
  const ready = fs.some(f => f.state.status !== 0)
  if (ready) {
    h(fs)
    return noop
  }

  const wrapped = (_: Fiber<A>) => {
    unhandleAll()
    h(fs)
  }

  const unhandles = fs.map(f => join(wrapped, f))
  const unhandleAll = () => unhandles.forEach(u => u())

  return unhandleAll
}

const join = <A> (h: (f: Fiber<A>) => void, f: Fiber<A>): Unhandle => {
  if(f.state.status === -1) return () => {}
  else if(f.state.status === 0) return addToHandlers(h, f.state.handlers)

  h(f)
  return noop
}

const addToHandlers = <A> (h: (a: A) => void, handlers: ((a: A) => void)[]): Unhandle => {
  handlers.push(h)
  return () => removeFromHandlers(handlers.indexOf(h), handlers)
}

const removeFromHandlers = <A> (i: number, handlers: ((a: A) => void)[]): void => {
  if (i >= 0) handlers.splice(i, 1)
}