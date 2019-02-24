import { Todo } from './todoList'
import { Action, action, Handler, withEffect, WithEffects } from '../../../packages/app/src'
import { Cancel, Fx, map } from '../../../packages/core/src'

// -----------------------------------------------
// A routing effect
export type Route = {
	route: (k: (s: string) => void) => Cancel,
}

export const route: Fx<Route, string> = ({ route }, k) => route(k)

// -----------------------------------------------
// Todo filters

export type Filter = '/active' | '/completed' | null

export type TodoFilterAction = Action<'filter', Filter>

export const todoFilter: Handler<Route, TodoFilterAction, Filter> = {
	filter: (_: Filter, filter: Filter): WithEffects<Filter, ReadonlyArray<Fx<Route, TodoFilterAction>>> =>
		withEffect(filter, filterUpdate)
}

export const filterUpdate: Fx<Route, TodoFilterAction> =
	map(s => action('filter', parseFilter(s)), route)

export const parseFilter = (s: string): Filter =>
	s === '/active' || s === '/completed' ? s : null

export const filterTodos = (filter: Filter, todos: ReadonlyArray<Todo>): ReadonlyArray<Todo> =>
	filter === '/completed' ? todos.filter(t => t.completed)
		: filter === '/active' ? todos.filter(t => !t.completed)
			: todos
