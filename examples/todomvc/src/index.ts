import { todoEdit } from './todoEdit'
import { todoList } from './todoList'
import { view } from './view'
import { ActionsOf, runApp, runFx } from '../../../src'
import { renderLitHtml } from '../../../src/lit-html-view'

export const todoApp = { ...todoList, ...todoEdit }

const appFx = runApp(todoApp, view, { todos: [], editing: null })

runFx(appFx, {
	...renderLitHtml<ActionsOf<typeof todoApp>>(document.body)
})
