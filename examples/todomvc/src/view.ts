import { TodoEditAction, TodoEditState } from './todoEdit'
import { Filter, filterTodos } from './todoFilter'
import { countActive, Todo, TodoAction } from './todoList'
import { action } from '../../../packages/app/src'
import { html, TemplateResult } from 'lit-html'

type ViewState = { todos: ReadonlyArray<Todo>, editing: Todo | null, filter: Filter }

const ENTER_KEY = 'Enter'
const ESC_KEY = 'Escape'

const handleAddKey = (e: any): TodoAction | null => {
	if (e.key !== ENTER_KEY || e.target.value.trim() === '') return null

	const description = e.target.value.trim()
	e.target.value = ''
	return action('add', description)
}

const handleEditKey = (e: any): TodoEditAction | null =>
	e.key === ESC_KEY ? action('cancelEdit')
		: e.key === ENTER_KEY ? action('saveEdit', e.target.value.trim())
		: null

const handleSaveEdit = (e: any): TodoEditAction =>
	action('saveEdit', e.target.value.trim())

const showIf = (condition: boolean): string => condition ? '' : 'display: none'

export const view = ({ todos, editing, filter }: ViewState): TemplateResult => {
	const active = countActive(todos)
	const showList = showIf(todos.length > 0)
	const showClear = showIf(todos.length > active)

	return html`
	<section class="todoapp">
		<header class="header">
			<h1>todos</h1>
			<input class="new-todo" placeholder="What needs to be done?" autofocus @keydown=${handleAddKey}>
		</header>
		<!-- This section should be hidden by default and shown when there are todos -->
		<section class="main" .style="${showList}">
			<input id="toggle-all" class="toggle-all" type="checkbox" .checked=${active === 0} @change=${(e: any) => action('updateAll', e.target.checked)}>
			<label for="toggle-all">Mark all as complete</label>
			<ul class="todo-list">
				${filterTodos(filter, todos).map(todo => html`
				<li class="${todo.completed ? 'completed' : ''} ${editing === todo ? 'editing' : ''}">
					<div class="view">
						<input class="toggle" type="checkbox" .checked=${todo.completed} @change=${(e: any) => action('update', { todo, completed: e.target.checked })}>
						<label @dblclick=${action('beginEdit', todo)}>${todo.description}</label>
						<button class="destroy" @click=${action('remove', todo)}></button>
					</div>
					<input class="edit" value="${todo.description}" autofocus @keydown=${handleEditKey} @blur=${handleSaveEdit}>
				</li>
				`)}
			</ul>
		</section>
		<footer class="footer" .style="${showList}">
			<span class="todo-count"><strong>${active}</strong> ${active === 1 ? 'item' : 'items'} left</span>
			<ul class="filters">
				<li><a class="${filter === null ? 'selected' : ''}" href="#/">All</a></li>
				<li><a class="${filter === '/active' ? 'selected' : ''}" href="#/active">Active</a></li>
				<li><a class="${filter === '/completed' ? 'selected' : ''}" href="#/completed">Completed</a></li>
			</ul>
			<!-- Hidden if no completed items are left ↓ -->
			<button class="clear-completed" .style="${showClear}" @click=${action('removeCompleted')}>Clear completed</button>
		</footer>
	</section>
	<footer class="info">
		<p>Double-click to edit a todo</p>
		<p>Template by <a href="http://sindresorhus.com">Sindre Sorhus</a></p>
		<p>Created by <a href="http://todomvc.com">you</a></p>
		<p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
	</footer>
	`
}
