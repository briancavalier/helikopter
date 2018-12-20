import { Cancel } from '../experiments/effect'
import { directive, EventPart, Part, render as lrender, TemplateResult } from 'lit-html'

export const handleRender = <A>(t: TemplateResult, at: Element, k: (a: A) => void): Cancel => {
  const newValues = t.values.map(x => intent(k, x))
  const nt = new TemplateResult(t.strings, newValues, t.type, t.processor)
  const id = requestAnimationFrame(() => lrender(nt, at))
  return () => cancelAnimationFrame(id)
}

const intent = directive((f: (i: any) => void, i: any) => (part: Part) =>
  part.setValue(part instanceof EventPart ? () => f(i) : i))
