import { Task } from './task'

export type Handler<A> = (a: A) => void
export type Unhandle = () => void

export class EventSource<A> {
  readonly handlers: Handler<A>[] = []
  handleEvent (a: A): void { this.handlers.forEach(h => h(a)) }
}

export const event = <A> (): EventSource<A> => new EventSource<A>()

export const handle = <A> (h: Handler<A>, { handlers }: EventSource<A>): Unhandle => {
  handlers.push(h)
  return () => removeHandler(handlers.indexOf(h), handlers)
}

const removeHandler = <A> (i: number, handlers: Handler<A>[]): void => {
  if (i >= 0) handlers.splice(i, 1)
}

export type Snapshot<T> = { [K in keyof T]: Sample<T[K]> }

export type Sample<T> = T extends EventSource<infer A> ? (A | undefined) : void

export const snapshot = <T> (t: T): Task<Snapshot<T>> =>
  new Task(f => {
    const keys = Object.keys(t)
    const unhandles = [] as Unhandle[]
    const cancel = () => unhandles.forEach(u => u())
    for (const k of keys) {
      const s = t[k]
      if (s instanceof EventSource) {
        const u = handle(e => {
          cancel()
          const vs = {} as Snapshot<T>
          for (const ks of keys) {
            vs[ks] = ks === k ? e : undefined
          }
          f(vs)
        }, s)
        unhandles.push(u)
      }
    }
    return cancel
  })