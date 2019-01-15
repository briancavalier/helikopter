export type Todo = { description: string, completed: boolean }

export type Todos = ReadonlyArray<Todo>

export type TodoListState = { todos: Todos }

export const countActive = (todos: Todos): number =>
	todos.reduce((count, { completed }) => count + (completed ? 0 : 1), 0)

export const addTodo = (description: string) => (s: TodoListState): TodoListState =>
	({ todos: [...s.todos, { description, completed: false }] })

export const removeTodo = (todo: Todo) => (s: TodoListState): TodoListState =>
	({ todos: s.todos.filter(t => t !== todo) })

export const updateCompleted = (completed: boolean, todo: Todo) => (s: TodoListState): TodoListState =>
	({ todos: s.todos.map(t => t === todo ? { ...t, completed } : t) })

export const removeAllCompleted = (s: TodoListState): TodoListState =>
	({ todos: s.todos.filter(todo => !todo.completed) })

export const updateAllCompleted = (completed: boolean) => (s: TodoListState): TodoListState =>
	({ todos: s.todos.map(todo => ({ ...todo, completed })) })

export const todoList = {
	addTodo, removeTodo, updateCompleted, removeAllCompleted, updateAllCompleted, countActive
}

export type TodoList = typeof todoList
