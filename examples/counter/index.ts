import { action, Action, createApp, PureHandler, runApp } from '../../packages/app/src'
import { renderLitHtml } from '../../packages/render-lit-html/src'
import { html, TemplateResult } from 'lit-html'

export type CounterAction = Action<'inc'> | Action<'dec'> | Action<'reset'>

export const counter: PureHandler<CounterAction, number> = {
  inc: c => c + 1,
  dec: c => c - 1,
  reset: () => 0
}

const view = (count: number): TemplateResult => html`
  <p>${count}</p>
  <p>
    <button @click=${action('inc')}>+</button>
    <button @click=${action('dec')}>-</button>
    <button @click=${action('reset')} ?disabled=${count === 0}>Reset</button>
  </p>
`

const appFx = createApp(counter, view, 0)

runApp(appFx, renderLitHtml<CounterAction>(document.body))
