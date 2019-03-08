import { todoEdit, TodoEditAction } from './todoEdit'
import { filterUpdate, todoFilter, TodoFilterAction } from './todoFilter'
import { TodoAction, todoList } from './todoList'
import { view } from './view'
import { createApp, prop, runApp } from '../../../packages/app/src'
import { Cancel } from '../../../packages/core/src'
import { renderLitHtml } from '../../../packages/render-lit-html/src'

type TodoAppAction = TodoAction | TodoEditAction | TodoFilterAction

const todoApp = {
	...prop('todos', todoList),
	...todoEdit,
	...prop('filter', todoFilter)
}

const initialState = { todos: [], editing: null, filter: null }

const appFx = createApp(todoApp, view, initialState, [filterUpdate])

runApp(appFx, {
	...renderLitHtml<TodoAppAction>(document.body),
	route (k: (r: string) => void): Cancel {
		const handler = () => k(window.location.hash.slice(1))
		window.addEventListener('hashchange', handler, { once: true })
		return () => window.removeEventListener('hashchange', handler)
	}
})
