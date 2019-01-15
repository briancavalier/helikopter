import { Todo, TodoListState } from './todoList'
import { Maybe } from '../../../src'

export type TodoEditState = TodoListState & { editing: Maybe<Todo> }

export const beginEdit = (editing: Todo) => (s: TodoEditState): TodoEditState =>
	({ ...s, editing })

export const cancelEdit = (s: TodoEditState): TodoEditState =>
	({ ...s, editing: null })

export const saveEdit = (description: string) => (s: TodoEditState): TodoEditState =>
	description
		? { todos: s.todos.map(t => t !== s.editing ? t : { ...s.editing, description }), editing: null }
		: { todos: s.todos.filter(t => t !== s.editing), editing: null }

export const todoEdit = {
	beginEdit, cancelEdit, saveEdit
}

export type TodoEdit = typeof todoEdit
