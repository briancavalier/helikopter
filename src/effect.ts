
export type Cancel = () => void
export type Cont<A> = (a: A) => void
export type Handler<E, A> = (e: E, k: (a: A) => void) => Cancel

export class Effect<E, A> {}

export class PureEffect<A> extends Effect<never, A> {
  constructor (public readonly value: A) { super() }
}

export class AnEffect<E, A> extends Effect<E, A> {
  constructor (public readonly op: E) { super() }
}

export class RunEffect<E, A> extends Effect<E, A> {
  constructor (public readonly runEffect: (h: Handler<E, A>, k: (a: A) => void) => Cancel) { super() }
}

export const effect = <E, A> (op: E): Effect<E, A> =>
  new AnEffect(op)

export const pure = <A> (a: A): Effect<never, A> =>
  new PureEffect(a)

export const runEffect = <E, A> (f: (a: A) => void, h: Handler<E, A>, eff: Effect<E, A>): Cancel => {
  if (eff instanceof PureEffect) {
    f(eff.value)
    return () => {}
  }
  else if (eff instanceof AnEffect) return h(eff.op, f)
  else if (eff instanceof RunEffect) return eff.runEffect(h, f)
  throw new Error(`unsupported effect constructor: ${eff.constructor.name}`)
}

export const mapTo = <E, A, B> (b: B, e: Effect<E, A>): Effect<E, B> =>
  new RunEffect((h: Handler<E, B>, k) =>
    runEffect(_ => k(b), h, e))

export const delay = (ms: number): Effect<{ type: 'delay', ms: number }, void> =>
  new AnEffect({ type: 'delay', ms })
