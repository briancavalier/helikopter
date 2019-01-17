import { Todo } from './todoList'
import { Cancel, Fx, map, Maybe, withEffects } from '../../../src'

export type Route<A> = {
	route: (k: (s: A) => void) => Cancel,
}

export const route = <A> (): Fx<Route<A>, A> =>
	({ route }, k) => route(k)

export type Filter = '/active' | '/completed'

export type FilterTodoState = { filter: Maybe<Filter> }

export const updateFilter = (filter: string) => () =>
	withEffects({ filter: parseFilter(filter) }, [map(updateFilter, route())])

export const parseFilter = (s: string): Maybe<Filter> =>
	s === '/active' || s === '/completed' ? s : null

export const filterTodos = (filter: Maybe<Filter>, todos: ReadonlyArray<Todo>): ReadonlyArray<Todo> =>
	filter === '/completed' ? todos.filter(t => t.completed)
		: filter === '/active' ? todos.filter(t => !t.completed)
			: todos

export const todoFilter = { updateFilter }

export type TodoFilter = typeof todoFilter
