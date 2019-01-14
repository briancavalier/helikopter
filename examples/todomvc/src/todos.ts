export type Todo = { description: string, completed: boolean }

export type Todos = ReadonlyArray<Todo>

export type Filter = string

export type TodoState = { todos: Todos }

export const countRemaining = (todos: Todos): number =>
	todos.reduce((count, { completed }) => count + (completed ? 0 : 1), 0)

export const addTodo = (description: string) => (s: TodoState): TodoState =>
	({ todos: [...s.todos, { description, completed: false }] })

export const removeTodo = (todo: Todo) => (s: TodoState): TodoState =>
	({ todos: s.todos.filter(t => t !== todo) })

export const updateCompleted = (completed: boolean, todo: Todo) => (s: TodoState): TodoState =>
	({ todos: s.todos.map(t => t === todo ? { ...t, completed } : t) })

export const removeAllCompleted = (s: TodoState): TodoState =>
	({ todos: s.todos.filter(todo => !todo.completed) })

export const updateAllCompleted = (completed: boolean) => (s: TodoState): TodoState =>
	({ todos: s.todos.map(todo => ({ ...todo, completed })) })

export const todoList = {
	addTodo, removeTodo, updateCompleted, removeAllCompleted, updateAllCompleted
}

export type TodoApp = typeof todoList

export const todoApp: TodoApp = todoList
