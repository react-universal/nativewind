import type { CSSValue } from '../css/css.types.js';

export function interleave<Interpolations>(
  strings: TemplateStringsArray,
  interpolations: readonly Interpolations[],
  handle: (interpolation: Interpolations) => string,
): string {
  return interpolations.reduce(
    (result: string, interpolation, index) =>
      result + handle(interpolation) + strings[index + 1],
    strings[0],
  )!;
}

// based on https://github.com/lukeed/clsx and https://github.com/jorgebucaran/classcat
export function interpolate(
  strings: TemplateStringsArray | CSSValue,
  interpolations: CSSValue[],
): string {
  if (
    Array.isArray(strings) &&
    Array.isArray((strings as unknown as TemplateStringsArray).raw)
  ) {
    return interleave(
      strings as unknown as TemplateStringsArray,
      interpolations,
      (value) => toString(value).trim(),
    );
  }

  return interpolations
    .filter(Boolean)
    .reduce(
      (result: string, value) => result + toString(value),
      strings ? toString(strings as CSSValue) : '',
    ) as string;
}

export function toString(value: CSSValue): string {
  let result = '';
  let tmp: string;

  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      if ((tmp = interpolate(value[0], value.slice(1)))) {
        result += ` ${tmp}`;
      }
    } else {
      for (const key in value) {
        if (value[key]) result += ` ${key}`;
      }
    }
  } else if (value != null && typeof value !== 'boolean') {
    result += ` ${value}`;
  }

  return result;
}

export function normalize(value: string): string {
  // Keep raw strings if it starts with `url(`
  if (value.includes('url(')) {
    return value.replace(
      /(.*?)(url\(.*?\))(.*?)/g,
      (_, before = '', url, after = '') => normalize(before) + url + normalize(after),
    );
  }

  return (
    value
      // Convert `_` to ` `, except for escaped underscores `\_`
      .replace(
        /(^|[^\\])_+/g,
        (fullMatch, characterBefore: string) =>
          characterBefore + ' '.repeat(fullMatch.length - characterBefore.length),
      )
      .replace(/\\_/g, '_')

      // Add spaces around operators inside math functions like calc() that do not follow an operator
      // or '('.
      .replace(/(calc|min|max|clamp)\(.+\)/g, (match) =>
        match.replace(
          /(-?\d*\.?\d(?!\b-.+[,)](?![^+\-/*])\D)(?:%|[a-z]+)?|\))([+\-/*])/g,
          '$1 $2 ',
        ),
      )
  );
}
