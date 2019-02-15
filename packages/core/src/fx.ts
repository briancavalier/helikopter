export type Cancel = void | ((k: (r: void) => void) => void)

export const runCancel = (c: Cancel, k: (r: void) => void): void =>
  c ? c(k) : k()

export type Fx<H, A> = (handler: H, k: (a: A) => void) => Cancel
export type Pure<A> = Fx<{}, A>

export const handle = <H0, H1, A>(fx: Fx<H0 & H1, A>, h1: H1): Fx<H0, A> =>
  (h0, k) => fx({ ...h0, ...h1 } as H0 & H1, k)

export const runPure = <A>(fx: Fx<{}, A>, k: (a: A) => void = () => {}): Cancel =>
  fx({}, k)

export const pure = <A> (a: A): Pure<A> =>
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
