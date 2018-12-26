import { Render } from './render'
import { Cancel } from '../experiments/effect'
import { directive, EventPart, NodePart, Part, render as lrender, TemplateResult } from 'lit-html'

export const renderLitHtml = <A> (root: Element): Render<TemplateResult, A> => ({
  render: (t: TemplateResult, k: (a: A) => void): Cancel => handleRender(t, root, k)
})

export const handleRender = <A>(t: TemplateResult, at: Element, k: (a: A) => void): Cancel => {
  const nt = wrapHandlers(k, t)
  const id = requestAnimationFrame(() => lrender(nt, at))
  return () => cancelAnimationFrame(id)
}

const wrapHandlers = <A> (k: (a: A) => void, t: TemplateResult): TemplateResult =>
  new TemplateResult(t.strings, t.values.map(x => intent(k, x)), t.type, t.processor)

const intent = directive((k: (a: any) => void, i: any) => (part: Part) =>
  part.setValue(
    part instanceof EventPart
      ? typeof i === 'function' ? (e: Event) => k(i(e)) : () => k(i)
    : part instanceof NodePart
      ? Array.isArray(i) ? i.map(x => x instanceof TemplateResult ? wrapHandlers(k, x) : x)
      : i instanceof TemplateResult ? wrapHandlers(k, i)
      : i
     : i))
