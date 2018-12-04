import { render, TemplateResult } from 'lit-html'
import { Task } from './task'

export const renderLit = <E> ([t, e]: [TemplateResult, E]): Task<E> => {
  return new Task(f => {
    render(t, document.body)
    f(e)
    return () => {}
  })
}