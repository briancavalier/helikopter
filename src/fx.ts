export type Cancel = () => void

export type Fx<H, A> = (handler: H, k: (a: A) => void) => Cancel

export const runFx = <H, A>(fx: Fx<H, A>, handler: H, k: (a: A) => void): Cancel =>
  fx(handler, k)

export const pure = <A> (a: A): Fx<unknown, A> =>
  (_, k) => {
    k(a)
    return () => {}
  }

export const mapTo = <H, A, B> (b: B, fx: Fx<H, A>): Fx<H, B> =>
  (h, kb) => fx(h, _ => kb(b))

export type Delay = {
  delay: (ms: number, k: (r: void) => void) => Cancel
}

export const delay = (ms: number): Fx<Delay, void> =>
  ({ delay }, k) => delay(ms, k)