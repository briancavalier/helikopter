// Actions represent an intent to change state
export type Action<K, A = void> = {
  readonly name: K,
  readonly value: A
}

export function action<K extends string, A>(name: K, value: A): Action<K, A>;
export function action<K extends string>(name: K): Action<K, void>;
export function action<K extends string, A>(name: K, value?: A): Action<K, void> | Action<K, A> {
  return value === undefined ? { name, value: undefined } : { name, value }
}