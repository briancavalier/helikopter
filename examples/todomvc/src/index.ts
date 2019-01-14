import { todoApp } from './todos'
import { view } from './view'
import { ActionsOf, runApp, runFx } from '../../../src'
import { renderLitHtml } from '../../../src/lit-html-view'

const appFx = runApp(todoApp, view, { todos: [] })

runFx(appFx, {
	...renderLitHtml<ActionsOf<typeof todoApp>>(document.body)
})
