import { Todo } from './todoList'
import { Action, action, Cancel, Fx, Handler, map, Maybe, withEffects, WithEffects } from '../../../src'

export type Route = {
	route: (k: (s: string) => void) => Cancel,
}

export const route: Fx<Route, string> = ({ route }, k) => route(k)

export type Filter = '/active' | '/completed'

export type TodoFilterState = { readonly filter: Maybe<Filter> }

export type TodoFilterAction = Action<'filter', Maybe<Filter>>

export type TodoFilter = Handler<Route, TodoFilterAction, TodoFilterState>

export const todoFilter: TodoFilter = {
	filter: (_: TodoFilterState, filter: Maybe<Filter>): WithEffects<TodoFilterState, Fx<Route, TodoFilterAction>[]> =>
		withEffects({ filter }, [filterUpdate])
}

export const filterUpdate: Fx<Route, TodoFilterAction> =
	map(s => action('filter', parseFilter(s)), route)

export const parseFilter = (s: string): Maybe<Filter> =>
	s === '/active' || s === '/completed' ? s : null

export const filterTodos = (filter: Maybe<Filter>, todos: ReadonlyArray<Todo>): ReadonlyArray<Todo> =>
	filter === '/completed' ? todos.filter(t => t.completed)
		: filter === '/active' ? todos.filter(t => !t.completed)
			: todos
