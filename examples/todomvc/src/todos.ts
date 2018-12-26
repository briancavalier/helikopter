import { Cancel, Fx, map, mapTo, Update, UpdateState } from '../../../src'

export type Todo = { description: string, completed: boolean }

export type Todos = ReadonlyArray<Todo>

export type Filter = string

export type TodoState = {
	todos: Todos,
	editing: Todo | null,
	filter: Filter
}

export type TodoAction =
	| { action: 'none' }
	| { action: 'load', todos: Todos }
	| { action: 'add', description: string }
	| { action: 'remove', todo: Todo }
	| { action: 'update', todo: Todo, completed: boolean }
	| { action: 'startEdit', todo: Todo }
	| { action: 'completeEdit', todo: Todo, description: string }
	| { action: 'cancelEdit' }
	| { action: 'toggleAllCompleted', completed: boolean }
	| { action: 'removeCompleted' }
	| { action: 'setFilter', filter: Filter }

export const withStorage = <H> (update: UpdateState<H, TodoState, TodoAction>): UpdateState<H & Storage, TodoState, TodoAction> =>
	(s0, a, fs) => {
		const [s1, fx] = update(s0, a, fs)
		return [s1, s0.todos === s1.todos ? fx : [...fx, mapTo({ action: 'none' } as TodoAction, save(s1.todos))]]
	}

export const updateTodos = (s: TodoState, a: TodoAction): Update<Routing, TodoState, TodoAction> => {
	switch (a.action) {
		case 'none': return [s, []]
		case 'load': return [{ ...s, todos: a.todos }, []]
		case 'add': return [addTodo(a.description, s), []]
		case 'remove': return [removeTodo(a.todo, s), []]
		case 'update': return [updateCompleted(a.completed, a.todo, s), []]
		case 'toggleAllCompleted': return [updateAllCompleted(a.completed, s), []]
		case 'removeCompleted': return [removeAllCompleted(s), []]
		case 'startEdit': return [{ ...s, editing: a.todo }, []]
		case 'completeEdit': return [completeEdit(a.description, a.todo, s), []]
		case 'cancelEdit': return [{ ...s, editing: null }, []]
		case 'setFilter': return [{ ...s, filter: a.filter }, [map(filter => ({ action: 'setFilter', filter }) as TodoAction, route())]]
	}
}

export const emptyApp: TodoState =
	{ todos: [], editing: null, filter: '/' }

export const countRemaining = (todos: Todos): number =>
	todos.reduce((count, { completed }) => count + (completed ? 0 : 1), 0)

export const addTodo = (description: string, s: TodoState): TodoState =>
	({ ...s, todos: [...s.todos, { description, completed: false }] })

export const removeTodo = (todo: Todo, s: TodoState): TodoState =>
	({ ...s, todos: s.todos.filter(t => t !== todo) })

export const updateCompleted = (completed: boolean, todo: Todo, s: TodoState): TodoState =>
	({ ...s, todos: s.todos.map(t => t === todo ? { ...t, completed } : t) })

export const completeEdit = (description: string, todo: Todo, s: TodoState): TodoState =>
	description ? replaceTodo(todo, { ...todo, description }, s) : removeTodo(todo, s)

const replaceTodo = (find: Todo, replace: Todo, s: TodoState): TodoState =>
	({ ...s, todos: s.todos.map(todo => todo === find ? replace : todo) })

export const updateAllCompleted = (completed: boolean, s: TodoState): TodoState =>
	({ ...s, todos: s.todos.map(todo => ({ ...todo, completed })) })

export const removeAllCompleted = (s: TodoState): TodoState =>
	({ ...s, todos: s.todos.filter(todo => !todo.completed) })

export const setFilter = (filter: Filter, s: TodoState): TodoState =>
	({ ...s, filter })

export type Storage = {
	load: (k: (todos: Todos) => void) => Cancel,
	save: (todos: Todos, k: (r: void) => void) => Cancel
}

export const load = (): Fx<Storage, Todos> =>
	({ load }, k) => load(k)

export const save = (todos: Todos): Fx<Storage, void> =>
	({ save }, k) => save(todos, k)

export type Routing = {
	route: (k: (s: string) => void) => Cancel,
}

export const route = (): Fx<Routing, string> =>
	({ route }, k) => route(k)
