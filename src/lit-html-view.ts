import { Render } from './render'
import { Cancel } from '../experiments/effect'
import { directive, EventPart, NodePart, Part, render as lrender, TemplateResult } from 'lit-html'

export const renderLitHtml = <A> (root: Element): Render<TemplateResult, A> => ({
  render: (v: TemplateResult, k: (a: A) => void): Cancel => handleRender(v, root, k)
})

export const handleRender = <A>(v: TemplateResult, at: Element, k: (a: A) => void): Cancel => {
  const nt = wrapHandlers(k, v)
  const id = requestAnimationFrame(() => lrender(nt, at))
  return () => cancelAnimationFrame(id)
}

const wrapHandlers = <A>(k: (a: A) => void, t: TemplateResult): TemplateResult =>
  new TemplateResult(t.strings, t.values.map(x => intent(k, x)), t.type, t.processor)

const intent = directive((k: (a: any) => void, x: any) => (part: Part) =>
  part.setValue(
    part instanceof EventPart
      ? typeof x === 'function' ? (e: Event) => k(x(e)) : () => k(x)
    : part instanceof NodePart
        ? Array.isArray(x) ? x.map(x => x instanceof TemplateResult ? wrapHandlers(k, x) : x)
          : x instanceof TemplateResult ? wrapHandlers(k, x)
      : x
     : x))
