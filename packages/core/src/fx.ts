export type Cancel = void | ((k: (r: void) => void) => void)

export const runCancel = (c: Cancel, k: (r: void) => void): void =>
  c ? c(k) : k()

export type Fx<H, A> = (handler: H, k: (a: A) => void) => Cancel

export type None = Subtract<{}, {}>

export type Subtract<T, T1> = Pick<T, Exclude<keyof T, keyof T1>>

export function handle<H, H1 extends H, A>(fx: Fx<H, A>, h1: H1): Fx<None, A>
export function handle<H, H1 extends Partial<H>, A>(fx: Fx<H, A>, h1: H1): Fx<Subtract<H, H1>, A>
export function handle<H, H1, A>(fx: Fx<H, A>, h1: H1): Fx<any, A> {
  return (h0, k) => fx({ ...h0, ...h1 }, k)
}
// export const handle = <H, H1 extends H, A>(fx: Fx<H, A>, h1: H1): Fx<Subtract<H, H1>, A> =>
//   (h0, k) => fx({ ...h0, ...h1 }, k)

export const runPure = <A>(fx: Fx<None, A>, k: (a: A) => void = () => {}): Cancel =>
  fx({}, k)

export const pure = <A> (a: A): Fx<any, A> =>
  (_, k) => k(a)

export const map = <H, A, B> (f: (a: A) => B, fx: Fx<H, A>): Fx<H, B> =>
  (h, k) => fx(h, a => k(f(a)))

export const mapTo = <H, A, B> (b: B, fx: Fx<H, A>): Fx<H, B> =>
  map(_ => b, fx)

export const chain = <HA, HB, A, B>(f: (a: A) => Fx<HA, B>, fx: Fx<HB, A>): Fx<HA & HB, B> =>
  (env, k) => {
    let cancel = fx(env, a => {
      cancel = f(a)(env, k)
    })
    return k => runCancel(cancel, k)
  }
