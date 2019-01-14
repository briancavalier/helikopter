import { countRemaining as countActive, Todo, TodoApp, TodoState } from './todos'
import { Maybe } from '../../../src'
import { html } from 'lit-html'

const ENTER_KEY = 'Enter'

const handleAddKey = (e: any): Maybe<string> => {
	if (e.key !== ENTER_KEY || e.target.value.trim() === '') {
		return undefined
	}

	const description = e.target.value.trim()
	e.target.value = ''
	return description
}

const mapMaybe = <A, B> (f: (a: A) => B, ma: Maybe<A>): Maybe<B> =>
	ma == undefined ? undefined : f(ma)

export const view = (todoApp: TodoApp, { todos }: TodoState) => {
	const active = countActive(todos)

	return html`
	<section class="todoapp">
		<header class="header">
			<h1>todos</h1>
			<input class="new-todo" placeholder="What needs to be done?" autofocus @keydown=${(e: any) => mapMaybe(todoApp.addTodo, handleAddKey(e))}>
		</header>
		<!-- This section should be hidden by default and shown when there are todos -->
		${todos.length === 0
			? html``
			: html`
			<section class="main">
				<input id="toggle-all" class="toggle-all" type="checkbox" .checked=${active === 0} @change=${(e: any) => todoApp.updateAllCompleted(e.target.checked)}>
				<label for="toggle-all">Mark all as complete</label>
				<ul class="todo-list">
					${todos.map((todo: Todo) => html`
					<li class="${todo.completed ? 'completed' : ''}">
						<div class="view">
							<input class="toggle" type="checkbox" .checked=${todo.completed} @change=${(e: any) => todoApp.updateCompleted(e.target.checked, todo)}>
							<label>${todo.description}</label>
							<button class="destroy" @click=${() => todoApp.removeTodo(todo)}></button>
						</div>
					</li>`)}
				</ul>
			</section>
			<footer class="footer">
				<span class="todo-count"><strong>${active}</strong> ${active === 1 ? 'item' : 'items'} left</span>
				<!-- Hidden if no completed items are left ↓ -->
				${todos.length > active
					? html`<button class="clear-completed" @click=${() => todoApp.removeAllCompleted}>Clear completed</button>`
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
