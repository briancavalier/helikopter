import { Cancel } from './task'
import { Handler, Unhandle } from './signal'

export type ProcessStateUpdate<A> =
  | { status: 0, value: A }
  | { status: 1, value: A }
  | { status: -1, value: A | undefined }

  export type ProcessState<A> =
  | { status: 0, value: A | undefined, cancel: Cancel, handlers: Handler<ProcessState<A>>[] }
  | { status: 1, value: A }
  | { status: -1, value: A | undefined }

export class Fiber<A> {
  constructor(public state: ProcessState<A>) {}
}

export type ProcessControl<A> = (p: ProcessStateUpdate<A>) => void

export class Process<A> {
  constructor (private readonly _runProcess: (p: ProcessControl<A>) => Cancel, private readonly initial: A | undefined = undefined) {}
  runProcess (): Fiber<A> {
    const [control, fiber] = createFiber<A>(() => cancel(), this.initial)
    const cancel = this._runProcess(control)
    return fiber
  }
}

export const never: Process<any> = new Process(p => {
  p({ status: -1, value: undefined })
  return () => {}
})

export const createFiber = <A> (cancel: Cancel, value: A | undefined): [ProcessControl<A>, Fiber<A>] => {
  const f = new Fiber<A>({ status: 0, value, cancel, handlers: [] })
  return [p => update(p, f), f]
}

const update = <A> (update: ProcessStateUpdate<A>, f: Fiber<A>): void => {
  if (f.state.status === 0) {
    const handlers = f.state.handlers
    f.state = { ...f.state, ...update }
    handlers.forEach(w => w(f.state))
  } else {
    if (update.status === 0) {
      throw new Error('Process already completed')
    }
    f.state = update
  }
}

export const addHandler = <A> (h: Handler<ProcessState<A>>, f: Fiber<A>): Unhandle => {
  if(f.state.status !== 0) return () => {}
  return addToHandlers(h, f.state.handlers)
}

const addToHandlers = <A> (h: Handler<A>, handlers: Handler<A>[]): Unhandle => {
  handlers.push(h)
  return () => removeFromHandlers(handlers.indexOf(h), handlers)
}

const removeFromHandlers = <A> (i: number, handlers: Handler<A>[]): void => {
  if (i >= 0) handlers.splice(i, 1)
}

export type Snapshot<T> = { [K in keyof T]: Sample<T[K]> }

export type Sample<T> = T extends Process<infer A> ? Fiber<A> : never

export const snapshot = <T> (t: T): Snapshot<T> => {
  const keys = Object.keys(t)
  const fibers = {} as any
  for (const k of keys) {
    fibers[k] = (t as any)[k].runProcess()
  }
  return fibers
}