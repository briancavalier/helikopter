import { directive, EventPart, Part, render as lrender, TemplateResult } from 'lit-html'
import { Effect } from './effect'

export const render = <I> (t: TemplateResult, el: Element): Effect<I> =>
  new Effect<I>(f => {
    const newValues = t.values.map(x => intent(f, x))
    const nt = new TemplateResult(t.strings, newValues, t.type, t.processor)
    const id = requestAnimationFrame(() => lrender(nt, el))
    return () => cancelAnimationFrame(id)
  })

const intent = directive((f: (i: any) => void, i: any) => (part: Part) =>
  part.setValue(part instanceof EventPart ? () => f(i) : i))
