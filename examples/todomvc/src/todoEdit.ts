import { Todo } from './todoList'
import { Action, PureHandler } from '../../../packages/app/src'

export type TodoEditState = { readonly todos: ReadonlyArray<Todo>,  readonly editing: Todo | null }

export type TodoEditAction =
	| Action<'beginEdit', Todo>
	| Action<'cancelEdit'>
	| Action<'saveEdit', string>

export const todoEdit: PureHandler<TodoEditAction, TodoEditState> = {
	beginEdit: (s: TodoEditState, editing: Todo): TodoEditState =>
		({ ...s, editing }),

	cancelEdit: (s: TodoEditState): TodoEditState =>
		({ ...s, editing: null }),

	saveEdit: (s: TodoEditState, description: string): TodoEditState =>
		description
			? { todos: s.todos.map(t => t !== s.editing ? t : { ...s.editing, description }), editing: null }
			: { todos: s.todos.filter(t => t !== s.editing), editing: null }
}
