import { Todos } from './todoList'
import { Cancel, Fx, map, Maybe, withEffects } from '../../../src'

export type Route = {
	route: (k: (s: string) => void) => Cancel,
}

export const route = (): Fx<Route, string> =>
	({ route }, k) => route(k)

export type Filter = '/active' | '/completed'

export type FilterTodoState = { filter: Maybe<Filter> }

export const updateFilter = (filter: string) => () =>
	withEffects({ filter: parseFilter(filter) }, [map(updateFilter, route())])

export const parseFilter = (s: string): Maybe<Filter> =>
	s === '/active' || s === '/completed' ? s : null

export const filterTodos = (filter: Maybe<Filter>, todos: Todos): Todos =>
	filter === '/completed' ? todos.filter(t => t.completed)
		: filter === '/active' ? todos.filter(t => !t.completed)
			: todos

export const todoFilter = { updateFilter }

export type TodoFilter = typeof todoFilter
