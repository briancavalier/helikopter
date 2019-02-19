import { Action, PureHandler } from '../../../packages/app/src'

export type Todo = { readonly description: string, readonly completed: boolean }

export type TodoUpdate = { readonly todo: Todo, readonly completed: boolean }

export type TodoListState = { readonly todos: ReadonlyArray<Todo> }

export type TodoAction =
	| Action<'add', string>
	| Action<'remove', Todo>
	| Action<'update', TodoUpdate>
	| Action<'removeCompleted'>
	| Action<'updateAll', boolean>

export const todoList: PureHandler<TodoAction, TodoListState> = {
	add: ({ todos }: TodoListState, description: string): TodoListState =>
		({ todos: [...todos, { description, completed: false }] }),

	remove: ({ todos }: TodoListState, todo: Todo): TodoListState =>
		({ todos: todos.filter(t => t !== todo) }),

	update: ({ todos }: TodoListState, { todo, completed }: TodoUpdate): TodoListState =>
		({ todos: todos.map(t => t === todo ? { ...t, completed } : t) }),

	removeCompleted: ({ todos }: TodoListState): TodoListState =>
		({ todos: todos.filter(todo => !todo.completed) }),

	updateAll: ({ todos }: TodoListState, completed: boolean): TodoListState =>
		({ todos: todos.map(todo => ({ ...todo, completed })) })
}

export const countActive = (todos: ReadonlyArray<Todo>): number =>
	todos.reduce((count, { completed }) => completed ? count : count + 1, 0)
