import { countRemaining as countActive, Todo, TodoAction, Todos, TodoState } from './todos'
import { html } from 'lit-html'

const ENTER_KEY = 'Enter'
const ESC_KEY = 'Escape'

const handleAddKey = (e: any): TodoAction => {
	if (e.key !== ENTER_KEY || e.target.value.trim() === '') {
		return { action: 'none' }
	}

	const description = e.target.value.trim()
	e.target.value = ''
	return { action: 'add', description }
}

const handleEditKey = (todo: Todo) => (e: any): TodoAction => {
	if (e.key === ESC_KEY) return { action: 'cancelEdit' }
  else if (e.key === ENTER_KEY) {
		return { action: 'completeEdit', todo, description: e.target.value.trim() }
	}

	return { action: 'none' }
}

const handleCompleteEdit = (todo: Todo) => (e: any): TodoAction =>
	({ action: 'completeEdit', todo, description: e.target.value.trim() })

const filterTodos = (filter: string, todos: Todos): Todos =>
	filter === '/completed' ? todos.filter(t => t.completed)
		: filter === '/active' ? todos.filter(t => !t.completed)
		: todos

export const view = ({ todos, editing, filter }: TodoState) => {
	const active = countActive(todos)

	return html`
	<section class="todoapp">
		<header class="header">
			<h1>todos</h1>
			<input class="new-todo" placeholder="What needs to be done?" autofocus @keydown=${handleAddKey}>
		</header>
		<!-- This section should be hidden by default and shown when there are todos -->
		${todos.length === 0
			? html``
			: html`
			<section class="main">
				<input id="toggle-all" class="toggle-all" type="checkbox" .checked=${active === 0} @change=${(e: any) => ({ action: 'toggleAllCompleted', completed: e.target.checked })}>
				<label for="toggle-all">Mark all as complete</label>
				<ul class="todo-list">
					${filterTodos(filter, todos).map((todo: Todo) => html`
					<li class="${todo.completed ? 'completed' : ''} ${editing === todo ? 'editing' : ''}">
						<div class="view">
							<input class="toggle" type="checkbox" .checked=${todo.completed} @change=${{ action: 'update', todo, completed: !todo.completed }}>
							<label @dblclick=${{ action: 'startEdit', todo }}>${todo.description}</label>
							<button class="destroy" @click=${{ action: 'remove', todo }}></button>
						</div>
						${editing === todo
							? html`<input class="edit" value="${todo.description}" autofocus @keydown=${handleEditKey(todo)} @blur=${handleCompleteEdit(todo)}>`
							: html``
						}
					</li>`)}
				</ul>
			</section>
			<footer class="footer">
				<span class="todo-count"><strong>${active}</strong> ${active === 1 ? 'item' : 'items'} left</span>
				<ul class="filters">
					<li><a class="${filter !== '/active' && filter !== '/completed' ? 'selected' : ''}" href="#/">All</a></li>
					<li><a class="${filter === '/active' ? 'selected' : ''}" href="#/active">Active</a></li>
					<li><a class="${filter === '/completed' ? 'selected' : ''}" href="#/completed">Completed</a></li>
				</ul>
				<!-- Hidden if no completed items are left ↓ -->
				${todos.length > active
					? html`<button class="clear-completed" @click=${{ action: 'removeCompleted' }}>Clear completed</button>`
					: html``
				}
			</footer>
		`}
	</section>
	<footer class="info">
		<p>Double-click to edit a todo</p>
		<p>Template by <a href="http://sindresorhus.com">Sindre Sorhus</a></p>
		<p>Created by <a href="http://todomvc.com">you</a></p>
		<p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
	</footer>
	`
}
