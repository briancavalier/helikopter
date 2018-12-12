export type Cancel = () => void

export class Task<A> {
  constructor (public readonly runTask: (f: (a: A) => void) => Cancel) {}
}

export const never: Task<never> = new Task(k => () => {})

export const delay = <A> (ms: number, a: A): Task<A> =>
  new Task(f => {
    const t = setTimeout(f, ms, a)
    return () => clearTimeout(t)
  })

export const chainTask = <A, B> (f: (a: A) => Task<B>, ta: Task<A>): Task<B> =>
  new Task(k => {
    let c = ta.runTask(a => {
       c = f(a).runTask(k)
    })
    return () => c()
  })
