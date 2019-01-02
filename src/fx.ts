export type Cancel = (k: (r: void) => void) => void

export const uncancelable: Cancel = () => {}

export type Fx<H, A> = (handler: H, k: (a: A) => void) => Cancel
export type Pure<A> = Fx<unknown, A>

export const runFx = <H, A>(fx: Fx<H, A>, handler: H, k: (a: A) => void = () => {}): Cancel =>
  fx(handler, k)

export const pure = <A> (a: A): Pure<A> =>
  (_, k) => {
    k(a)
    return uncancelable
  }

export const map = <H, A, B> (f: (a: A) => B, fx: Fx<H, A>): Fx<H, B> =>
  (h, k) => fx(h, a => k(f(a)))

export const mapTo = <H, A, B> (b: B, fx: Fx<H, A>): Fx<H, B> =>
  map(_ => b, fx)
