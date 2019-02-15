import { todoEdit, TodoEditAction } from './todoEdit'
import { filterUpdate, todoFilter, TodoFilterAction } from './todoFilter'
import { TodoAction, todoList } from './todoList'
import { view } from './view'
import { run } from '../../../packages/app'
import { Cancel, handle, runPure } from '../../../packages/core'
import { renderLitHtml } from '../../../packages/render-lit-html'

type TodoAppAction = TodoAction | TodoEditAction | TodoFilterAction

const todoApp = { ...todoList, ...todoEdit, ...todoFilter }

const initialState = { todos: [], editing: null, filter: null }

const appFx = run(todoApp, view, initialState, [filterUpdate])

runPure(handle(appFx, {
	...renderLitHtml<TodoAppAction>(document.body),
	route (k: (r: string) => void): Cancel {
		const handler = () => k(window.location.hash.slice(1))
		window.addEventListener('hashchange', handler, { once: true })
		return () => window.removeEventListener('hashchange', handler)
	}
}))
