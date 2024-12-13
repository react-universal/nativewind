import type { CompleteStyle } from '../react-native/rn.types.js';
import type { Primitive, TemplateFunctions } from './transforms.types.js';

/** Converts the tagged template string into a css string */
export function buildCSSString<T extends Record<string, string>>(
  chunks: TemplateStringsArray,
  functions: (Primitive | TemplateFunctions<T>)[],
  props: T,
) {
  let computedString = chunks
    // Evaluate the chunks from the tagged template
    .flatMap((chunk, i) => {
      return [
        chunk,
        functions[i] instanceof Function
          ? (functions[i] as TemplateFunctions<T>)(props)
          : functions[i],
      ];
    })
    // Convert the objects to string if the result is not a primitive
    .map((chunk) => {
      return typeof chunk === 'object' ? (chunk as Partial<CompleteStyle>) : chunk;
    })
    .join('');
  if (props['className']) {
    computedString += ` ${props['className']}`;
  }
  if (props['tw']) {
    computedString += ` ${props['tw']}`;
  }
  return computedString.trim();
}
