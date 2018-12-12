export type Cancel = () => void
export class Task<A> {
  constructor (public readonly runTask: (f: (a: A) => void) => Cancel) {}
}

export const taskOf = <A> (a: A): Task<A> =>
  new Task(k => {
    k(a)
    return () => {}
  })

export const never: Task<never> = new Task(k => () => {})

export const chainTask = <A, B> (f: (a: A) => Task<B>, ta: Task<A>): Task<B> =>
  new Task(k => {
    let c = ta.runTask(a => {
       c = f(a).runTask(k)
    })
    return () => c()
  })

export const par = <A, B, C> (f: (a: A, b: B) => C, ta: Task<A>, tb: Task<B>): Task<C> => {
  return new Task(k => {
    let a: A
    let b: B
    let remaining = 2

    const ca = ta.runTask(av => {
      a = av
      if (--remaining === 0) k(f(a, b))
    })
    const cb = tb.runTask(bv => {
      b = bv
      if (--remaining === 0) k(f(a, b))
    })

    return () => { ca(); cb() }
  })
}

export const race = <A> (t1: Task<A>, t2: Task<A>): Task<[A, Cancel]> =>
  new Task(f => {
    const c1 = t1.runTask(a => f([a, c2]))
    const c2 = t2.runTask(a => f([a, c1]))
    return () => { c1(); c2()}
  })