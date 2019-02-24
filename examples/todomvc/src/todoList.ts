import { Action, PureHandler } from '../../../packages/app/src'

export type Todo = { readonly description: string, readonly completed: boolean }

export type TodoUpdate = { readonly todo: Todo, readonly completed: boolean }

export type TodoAction =
	| Action<'add', string>
	| Action<'remove', Todo>
	| Action<'update', TodoUpdate>
	| Action<'removeCompleted'>
	| Action<'updateAll', boolean>

export const todoList: PureHandler<TodoAction, ReadonlyArray<Todo>> = {
	add: (todos: ReadonlyArray<Todo>, description: string): ReadonlyArray<Todo> =>
		[...todos, { description, completed: false }],

	remove: (todos: ReadonlyArray<Todo>, todo: Todo): ReadonlyArray<Todo> =>
		todos.filter(t => t !== todo),

	update: (todos: ReadonlyArray<Todo>, { todo, completed }: TodoUpdate): ReadonlyArray<Todo> =>
		todos.map(t => t === todo ? { ...t, completed } : t),

	removeCompleted: (todos: ReadonlyArray<Todo>): ReadonlyArray<Todo> =>
		todos.filter(todo => !todo.completed),

	updateAll: (todos: ReadonlyArray<Todo>, completed: boolean): ReadonlyArray<Todo> =>
		todos.map(todo => ({ ...todo, completed }))
}

export const countActive = (todos: ReadonlyArray<Todo>): number =>
	todos.reduce((count, { completed }) => completed ? count : count + 1, 0)
