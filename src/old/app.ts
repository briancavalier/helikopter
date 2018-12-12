import { chainTask, par, Task, taskOf } from './task'
import { Snapshot, snapshot } from './signal'

export type UpdateState<S, T1, T2> = (s: S, e: Snapshot<T1 & T2>) => [S, T1]
export type UpdateView<S, T> = (s: S) => Task<T>

export const app = <VT, S, T> (update: UpdateState<S, T, VT>, render: UpdateView<S, VT>, s: S, t: T): Task<Snapshot<T>> =>
  chainTask(
    stvt => app(update, render, ...update(s, stvt)),
    chainTask<T & VT, Snapshot<T & VT>>(snapshot, par((t, vt) => ({ ...t, ...vt }), taskOf(t), render(s))))
