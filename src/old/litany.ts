// Copied from https://github.com/briancavalier/litany
export type Raw = 'raw'
export type Prepared = 'prepared'

// A Fragment represents a fragment of an expression in some
// language L, in some state S (such as compiled or uncompiled)
// with parameters V.
export class Fragment<L, V, S> {
  _language!: L
  _state!: S
  constructor (public readonly strings: ReadonlyArray<string>, public readonly values: V) {}
}

// Build a template tag for a language L.  The template tag
// can then be used to build Fragments in L:
// const sql = t<SQL>()
// const sqlFragment = sql`SELECT * FROM users`
export const t = <L> (): (<V extends unknown[]> (strings: TemplateStringsArray, ...values: V) => Fragment<L, V, Raw>) =>
  (strings, ...values) =>
    new Fragment(strings, values)

// Flatten a Fragment whose values may contain nested
// Fragments of the same language.  Internal mutation for speed,
// but they don't escape, so it's safe.
// TODO: How to preserve type info so we don't end up with
// unknown parameters?
function compile <L, V extends unknown[]> (s: Fragment<L, V, Prepared>): Fragment<L, V, Prepared>;
function compile <L, V extends unknown[]> (s: Fragment<L, V, Raw>): Fragment<L, unknown[], Prepared>
function compile <L, V extends unknown[]> (s: Fragment<L, V, Prepared | Raw>): Fragment<L, V | unknown[], Prepared> {
  const strings = s.strings.slice()
  const values = s.values.slice()

  let vindex = 0
  let sindex = 0
  for (let i = 0; i < s.values.length; i++) {
    const v = s.values[i]
    if (v instanceof Fragment) {
      const cv = compile(v)

      spliceTemplateStrings(sindex, cv.strings, strings)
      values.splice(vindex, 1, ...cv.values)

      vindex += cv.values.length
      sindex += cv.strings.length - 2
    } else {
      values[vindex] = v
      vindex += 1
      sindex += 1
    }
  }

  return new Fragment(strings, values)
}

export { compile }

// Splice (mutably) src array of template strings into dst,
// joining the strings at the start and end splice points
const spliceTemplateStrings = (i: number, src: ReadonlyArray<string>, dst: string[]): void => {
  const srcEnd = src.length - 1
  const dstEnd = Math.min(dst.length - 1, i + src.length)
  dst[i] = dst[i] + src[0]
  dst.splice(i + 1, 0, ...src.slice(1, srcEnd))
  if (dstEnd <= dst.length) {
    dst[dstEnd] = src[srcEnd] + dst[dstEnd]
  }
}
