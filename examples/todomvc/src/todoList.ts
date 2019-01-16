export type Todo = { description: string, completed: boolean }

export type TodoListState = { todos: ReadonlyArray<Todo> }

export const countActive = (s: TodoListState): number =>
	s.todos.reduce((count, { completed }) => completed ? count : count + 1, 0)

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
	countActive, addTodo, removeTodo, updateCompleted, removeAllCompleted, updateAllCompleted
}

export type TodoList = typeof todoList
