import { render, TemplateResult } from 'lit-html'
import { Task } from '../old/task'

type UpdateState<S, A> = (s: S, i: A) => [S, ReadonlyArray<Task<A>>]
type UpdateView<S, A> = (s: S) => Task<A>
type App<S, A> = { updateState: UpdateState<S, A>, updateView: UpdateView<S, A> }
type AppState<S, A> = { state: S, actions: A[] }

const _run = <A, S> (app: App<S, A>, s: AppState<S, A>, i: ReadonlyArray<Task<A>>): void => {
  const rt: Task<A> = app.updateView(s.state)
  const step = (i: A) => {
    const [st, t] = app.updateState(s.state, i)
    s.state = st
    _run(app, s, t)
  }
  [...i, rt].forEach(t => t.runTask(step))
}

export const run = <A, S> (app: App<S, A>, state: S): void =>
  _run(app, { state, actions: [] }, [])