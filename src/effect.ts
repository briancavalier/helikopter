
export type Cancel = () => void
export type Cont<A> = (a: A) => void
export type Handler<E, A> = (e: E, k: (a: A) => void) => Cancel

export type Fx<T, A> = { type: T } & A

export class Effect<E, A> {}

export class NoEffect<A> extends Effect<never, A> {
  constructor (public readonly value: A) { super() }
}

export class AnEffect<E, A> extends Effect<E, A> {
  constructor (public readonly op: E) { super() }
}

export class RunEffect<E, A, B> extends Effect<E, B> {
  constructor (public readonly runEffect: (h: Handler<E, A>, k: (b: B) => void) => Cancel) { super() }
}

export const effect = <E, A> (op: E): Effect<E, A> =>
  new AnEffect(op)

export const pure = <A> (a: A): Effect<never, A> =>
  new NoEffect(a)

export const runEffect = <E, A> (f: (a: A) => void, h: Handler<E, A>, eff: Effect<E, A>): Cancel => {
  if (eff instanceof NoEffect) {
    f(eff.value)
    return () => {}
  }
  else if (eff instanceof AnEffect) return h(eff.op, f)
  else if (eff instanceof RunEffect) return eff.runEffect(h, f)
  throw new Error(`unsupported effect constructor: ${eff.constructor.name}`)
}

export const mapTo = <E, A, B> (b: B, e: Effect<E, A>): Effect<E, B> =>
  new RunEffect<E, A, B>((h: Handler<E, A>, k: (b: B) => void) =>
    runEffect(_ => k(b), h, e))

export type Delay = Fx<'delay', { ms: number }>
export const delay = (ms: number): Effect<Delay, void> =>
  new AnEffect({ type: 'delay', ms })
