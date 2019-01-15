import { TodoEdit, todoEdit } from './todoEdit'
import { TodoList, todoList } from './todoList'
import { view } from './view'
import { ActionsOf, runApp, runFx } from '../../../src'
import { renderLitHtml } from '../../../src/lit-html-view'

export const todoApp = { ...todoList, ...todoEdit }

const appFx = runApp(todoApp, view, { todos: [], editing: undefined })

runFx(appFx, {
	...renderLitHtml<ActionsOf<typeof todoApp>>(document.body)
})
