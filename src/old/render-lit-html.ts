import { render, TemplateResult } from 'lit-html'
import { Task } from './task'

export type LitView<E> = [TemplateResult, E]

export const renderLit = <E> ([t, e]: LitView<E>): Task<E> => {
  return new Task(f => {
    render(t, document.body)
    f(e)
    return () => {}
  })
}