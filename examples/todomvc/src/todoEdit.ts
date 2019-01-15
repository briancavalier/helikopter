import { Todo, TodoListState } from './todoList'
import { Maybe, nothing } from '../../../src'

export type TodoEditState = TodoListState & { editing: Maybe<Todo> }

export const beginEdit = (editing: Todo) => (s: TodoEditState): TodoEditState =>
	({ ...s, editing })

export const saveEdit = (description: string) => (s: TodoEditState): TodoEditState =>
	description
		? { todos: s.todos.map(t => t !== s.editing ? t : {...s.editing, description }), editing: nothing }
		: { todos: s.todos.filter(t => t !== s.editing), editing: nothing }

export const cancelEdit = (s: TodoEditState): TodoEditState =>
	({ ...s, editing: nothing })

export const todoEdit = {
	beginEdit, saveEdit, cancelEdit
}

export type TodoEdit = typeof todoEdit
