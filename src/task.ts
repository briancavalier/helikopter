export type Cancel = () => void
export class Task<A> {
  constructor (public readonly run: (f: (a: A) => void) => Cancel) {}
}

export const taskOf = <A> (a: A): Task<A> =>
  new Task(f => {
    f(a)
    return () => {}
  })

export const chainTask = <A, B> (f: (a: A) => Task<B>, ta: Task<A>): Task<B> =>
  new Task(g => {
    let c = ta.run(a => {
       c = f(a).run(g)
    })
    return () => c()
  })

export const merge = <A, B> (ta: Task<A>, tb: Task<B>): Task<A & B> => {
  return new Task(f => {
    let merged = {} as A & B
    let remaining = 2
    const handle = (ab: A | B): void => {
      merged = { ...merged, ...ab }
      if (--remaining === 0) f(merged)
    }

    const ca = ta.run(handle)
    const cb = tb.run(handle)

    return () => { ca(); cb() }
  })
}