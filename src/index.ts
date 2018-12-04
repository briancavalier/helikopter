import { html, render, TemplateResult } from 'lit-html'

const pipe = <A, B, C> (f: (a: A) => B, g: (b: B) => C): (a: A) => C =>
  a => g(f(a))

const renderLit = <E> ([t, e]: [TemplateResult, E]): Task<E> => {
  return new Task(f => {
    render(t, document.body)
    f(e)
    return () => {}
  })
}

type Cancel = () => void
class Task<A> {
  constructor (public readonly run: (f: (a: A) => void) => Cancel) {}
}

const taskOf = <A> (a: A): Task<A> =>
  new Task(f => {
    f(a)
    return () => {}
  })

const chainTask = <A, B> (f: (a: A) => Task<B>, ta: Task<A>): Task<B> =>
  new Task(g => {
    let c = ta.run(a => {
       c = f(a).run(g)
    })
    return () => c()
  })

type Handler<A> = (a: A) => void
type Unhandle = () => void
type Occurrence<A> = A | null

class Event<A> {
  readonly handlers: Handler<A>[] = []
  handleEvent (a: A): void { this.handlers.forEach(h => h(a)) }
}

const event = <A> (): Event<A> => new Event()

const handle = <A> (h: Handler<A>, { handlers }: Event<A>): Unhandle => {
  handlers.push(h)
  return () => {
    const i = handlers.indexOf(h)
    if (i >= 0) handlers.splice(i, 1)
  }
}

const ifOccurred = <A, B> (e: Occurrence<B>, yes: A, no: A): A =>
  e ? yes : no

type Snapshot<T> = T extends Event<infer A>
  ? Occurrence<A>
  : { [K in keyof T]: Snapshot<T> }

const snapshot = <T> (t: Task<T>): Task<Snapshot<T>> =>
  new Task(f => {
    return t.run((es: any) => {
      const keys = Object.keys(es)
      const unhandles = [] as Unhandle[]
      for (const k of keys) {
        const u = handle(e => {
          unhandles.forEach(u => u())
          const vs = {} as any
          for (const ks of keys) {
            vs[ks] = ks === k ? e : null
          }
          f(vs)
        }, es[k])
        unhandles.push(u)
      }
    })
  })

const merge = <A, B> (ta: Task<A>, tb: Task<B>): Task<A & B> => {
  return new Task(f => {
    let merged = {} as A & B
    let remaining = 2
    const handle = (ab: A | B): void => {
      merged = { ...merged, ...ab }
      if (--remaining === 0) {
        f(merged)
      }
    }
    const ca = ta.run(handle)
    const cb = tb.run(handle)
    return () => { ca(); cb() }
  })
}

const run = <VT, S, T> (update: (s: S, e: Snapshot<T & VT>) => [S, Task<T>], render: (s: S) => Task<VT>, s: S, t: Task<T>): Task<T> =>
  chainTask(
    es => run(update, render, ...update(s, es)),
    snapshot(merge(t, render(s))))

type CounterEvents = { inc: Occurrence<unknown>, dec: Occurrence<unknown> }

const counter = (c: number, { inc, dec }: CounterEvents): [number, Task<{}>] => {
  const result = c + ifOccurred(inc, 1, 0) - ifOccurred(dec, 1, 0)
  return [result, taskOf({})]
}

const counterView = (c: number): [TemplateResult, { inc: Event<unknown>, dec: Event<unknown> }] => {
  const inc = event()
  const dec = event()
  const t = html`
    <p>${c}<button @click=${inc}>+</button><button @click=${dec}>-</button></p>
  `
  return [t, { inc, dec }]
}

run(counter, pipe(counterView, renderLit), 0, taskOf({})).run(x => console.log(x))