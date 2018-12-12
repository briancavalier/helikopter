export type Cancel = () => void
export type Handler<A> = (a: A) => void
export type Unhandle = () => void

export type FiberState<A> =
  | { status: 0, cancel: Cancel, handlers: Handler<Fiber<A>>[] }
  | { status: 1, value: A }
  | { status: -1 }

export class Fiber<A> {
  constructor(public state: FiberState<A>) {}
}

export class Effect<A> {
  constructor (private readonly _runEffect: (f: (a: A) => void) => Cancel) {}
  runEffect (): Fiber<A> {
    const cancel = this._runEffect(a => complete(a, fiber))
    const fiber = new Fiber<A>({ status: 0, cancel, handlers: [] })
    return fiber
  }
}

const complete = <A> (value: A, f: Fiber<A>): void => {
  if (f.state.status === 0) {
    const handlers = f.state.handlers
    f.state = { status: 1, value }
    handlers.forEach(h => h(f))
  }
}

export const select = <A> (f: (fs: ReadonlyArray<Fiber<A>>) => void, fs: ReadonlyArray<Fiber<A>>): void => {
  const h = (_: Fiber<A>) => {
    unhandles.forEach(u => u())
    f(fs)
  }

  const unhandles = fs.map(f => joinFiber(h, f))
}

export const joinFiber = <A> (h: Handler<Fiber<A>>, f: Fiber<A>): Unhandle => {
  if(f.state.status !== 0) {
    h(f)
    return () => {}
  }
  return addToHandlers(h, f.state.handlers)
}

const addToHandlers = <A> (h: Handler<A>, handlers: Handler<A>[]): Unhandle => {
  handlers.push(h)
  return () => removeFromHandlers(handlers.indexOf(h), handlers)
}

const removeFromHandlers = <A> (i: number, handlers: Handler<A>[]): void => {
  if (i >= 0) handlers.splice(i, 1)
}

export const delay = <A> (ms: number, a: A): Effect<A> =>
  new Effect(f => {
    const t = setTimeout(f, ms, a)
    return () => clearTimeout(t)
  })