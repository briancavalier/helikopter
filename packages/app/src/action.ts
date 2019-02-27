// Actions represent an intent to change state
export type Action<K, A = void> = { readonly key: K, readonly value: A }

export type ActionKeys<A> = A extends Action<infer K, any> ? K extends (string | number | symbol) ? K : never : never
export type ActionValue<K, A> = A extends Action<K, infer V> ? V : never

export function action<K extends string, A>(key: K, value: A): Action<K, A>;
export function action<K extends string>(key: K): Action<K, void>;
export function action<K extends string, A>(key: K, value?: A): Action<K, void> | Action<K, A> {
  return value === undefined ? { key, value: undefined } : { key, value }
}