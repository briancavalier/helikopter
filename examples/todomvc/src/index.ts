import { todoEdit } from './todoEdit'
import { route, todoFilter } from './todoFilter'
import { todoList } from './todoList'
import { view } from './view'
import { ActionsOf, Cancel, map, runApp, runFx } from '../../../src'
import { renderLitHtml } from '../../../src/lit-html-view'

export const todoApp = { ...todoList, ...todoEdit, ...todoFilter }

const initialState = { todos: [], editing: null, filter: null }

const filterChange = map(todoApp.updateFilter, route())

const appFx = runApp(todoApp, view, initialState, [filterChange])

runFx(appFx, {
	...renderLitHtml<ActionsOf<typeof todoApp>>(document.body),
	route (k: (r: string) => void): Cancel {
		const handler = () => k(window.location.hash.slice(1))
		window.addEventListener('hashchange', handler, { once: true })
		return () => window.removeEventListener('hashchange', handler)
	},
})
