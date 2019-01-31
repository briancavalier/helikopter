import { todoEdit, TodoEditAction } from './todoEdit'
import { filterUpdate, todoFilter, TodoFilterAction } from './todoFilter'
import { TodoAction, todoList } from './todoList'
import { view } from './view'
import { Cancel, run, runFx } from '../../../src'
import { renderLitHtml } from '../../../src/lit-html-view'

type TodoAppAction = TodoAction | TodoEditAction | TodoFilterAction

const todoApp = { ...todoList, ...todoEdit, ...todoFilter }

const initialState = { todos: [], editing: null, filter: null }

const appFx = run(todoApp, view, initialState, [filterUpdate])

runFx(appFx, {
	...renderLitHtml<TodoAppAction>(document.body),
	route (k: (r: string) => void): Cancel {
		const handler = () => k(window.location.hash.slice(1))
		window.addEventListener('hashchange', handler, { once: true })
		return () => window.removeEventListener('hashchange', handler)
	},
})
