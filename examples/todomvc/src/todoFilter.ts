import { Todo } from './todoList'
import { Action, action, Cancel, Fx, Handler, map, withEffects, WithEffects } from '../../../src'

export type Route = {
	route: (k: (s: string) => void) => Cancel,
}

export const route: Fx<Route, string> = ({ route }, k) => route(k)

export type Filter = '/active' | '/completed'

export type TodoFilterState = { readonly filter: Filter | null }

export type TodoFilterAction = Action<'filter', Filter | null>

export const todoFilter: Handler<Route, TodoFilterAction, TodoFilterState> = {
	filter: (_: TodoFilterState, filter: Filter | null): WithEffects<TodoFilterState, Fx<Route, TodoFilterAction>[]> =>
		withEffects({ filter }, [filterUpdate])
}

export const filterUpdate: Fx<Route, TodoFilterAction> =
	map(s => action('filter', parseFilter(s)), route)

export const parseFilter = (s: string): Filter | null =>
	s === '/active' || s === '/completed' ? s : null

export const filterTodos = (filter: Filter | null, todos: ReadonlyArray<Todo>): ReadonlyArray<Todo> =>
	filter === '/completed' ? todos.filter(t => t.completed)
		: filter === '/active' ? todos.filter(t => !t.completed)
			: todos
