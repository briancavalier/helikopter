import { Todo, TodoListState } from './todoList'
import { Action, Maybe, PureHandler } from '../../../src'

export type TodoEditState = TodoListState & { readonly editing: Maybe<Todo> }

export type TodoEditAction =
	| Action<'beginEdit', Todo>
	| Action<'cancelEdit'>
	| Action<'saveEdit', string>

export type TodoEdit = PureHandler<TodoEditAction, TodoEditState>

export const todoEdit: TodoEdit = {
	beginEdit: (s: TodoEditState, editing: Todo): TodoEditState =>
		({ ...s, editing }),

	cancelEdit: (s: TodoEditState): TodoEditState =>
		({ ...s, editing: null }),

	saveEdit: (s: TodoEditState, description: string): TodoEditState =>
		description
			? { todos: s.todos.map(t => t !== s.editing ? t : { ...s.editing, description }), editing: null }
			: { todos: s.todos.filter(t => t !== s.editing), editing: null }
}
