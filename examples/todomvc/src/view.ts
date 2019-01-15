import { TodoEdit } from './todoEdit'
import { Todo, TodoList } from './todoList'
import { ActionsOf, Maybe, nothing, StateOf } from '../../../src'
import { html, TemplateResult } from 'lit-html'

const ENTER_KEY = 'Enter'
const ESC_KEY = 'Escape'

const handleAddKey = ({ addTodo }: TodoList) => (e: any): Maybe<ActionsOf<TodoList>> => {
	if (e.key !== ENTER_KEY || e.target.value.trim() === '') return nothing

	const description = e.target.value.trim()
	e.target.value = ''
	return addTodo(description)
}

const handleEditKey = ({ cancelEdit, saveEdit }: TodoEdit) => (e: any): Maybe<ActionsOf<TodoEdit>> =>
	e.key === ESC_KEY ? cancelEdit
		: e.key === ENTER_KEY ? saveEdit(e.target.value.trim())
		: nothing

const handleCompleteEdit = ({ saveEdit }: TodoEdit) => (e: any): ActionsOf<TodoEdit> =>
	saveEdit(e.target.value.trim())

const showWhen = (condition: boolean): string => condition ? '' : 'display: none'

export const view = (todoApp: TodoList & TodoEdit, { todos, editing }: StateOf<TodoList & TodoEdit>): TemplateResult => {
	const active = todoApp.countActive(todos)
	const showList = showWhen(todos.length > 0)
	const showClear = showWhen(todos.length > active)

	return html`
	<section class="todoapp">
		<header class="header">
			<h1>todos</h1>
			<input class="new-todo" placeholder="What needs to be done?" autofocus @keydown=${handleAddKey(todoApp)}>
		</header>
		<!-- This section should be hidden by default and shown when there are todos -->
		<section class="main" .style="${showList}">
			<input id="toggle-all" class="toggle-all" type="checkbox" .checked=${active === 0} @change=${(e: any) => todoApp.updateAllCompleted(e.target.checked)}>
			<label for="toggle-all">Mark all as complete</label>
			<ul class="todo-list">
				${todos.map((todo: Todo) => html`
				<li class="${todo.completed ? 'completed' : ''} ${editing === todo ? 'editing' : ''}">
					<div class="view">
						<input class="toggle" type="checkbox" .checked=${todo.completed} @change=${(e: any) => todoApp.updateCompleted(e.target.checked, todo)}>
						<label @dblclick=${() => todoApp.beginEdit(todo)}>${todo.description}</label>
						<button class="destroy" @click=${() => todoApp.removeTodo(todo)}></button>
					</div>
					<input class="edit" value="${todo.description}" autofocus @keydown=${handleEditKey(todoApp)} @blur=${handleCompleteEdit(todoApp)}>
				</li>
				`)}
			</ul>
		</section>
		<footer class="footer" .style="${showList}">
			<span class="todo-count"><strong>${active}</strong> ${active === 1 ? 'item' : 'items'} left</span>
			<!-- Hidden if no completed items are left ↓ -->
			<button class="clear-completed" .style="${showClear}" @click=${() => todoApp.removeAllCompleted}>Clear completed</button>
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
