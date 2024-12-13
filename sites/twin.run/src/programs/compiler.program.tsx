import type { ComponentType } from 'react';
import React from 'react';
import { type Transform, transform as _transform } from 'sucrase';

const jsxConst = 'const _jsxFileName = "";';
const trimCode = (code: string) => code.trim().replace(/;$/, '');
const spliceJsxConst = (code: string) => code.replace(jsxConst, '').trim();
const addJsxConst = (code: string) => jsxConst + code;
const wrapReturn = (code: string) => `return (${code})`;

export const compileCode = (req: { jsx: string; css: string }) => {
  try {
    const firstPassTransforms: Transform[] = ['jsx', 'typescript'];

    const transformed = compose<string>(
      addJsxConst,
      transform({ transforms: ['imports'] }),
      spliceJsxConst,
      trimCode,
      transform({ transforms: firstPassTransforms }),
      wrapReturn,
      trimCode,
    )(req.jsx);
    // const spliced = spliceJsxConst(transformed.code);
    // const trimmed = trimCode(spliced);
    // const tsTransform = sucrase.transform(trimmed, { transforms: ['jsx', 'typescript'] });
    // const wrapped = wrapReturn(tsTransform.code);
    // const compiled = trimCode(wrapped);

    const Component = evalCode(transformed, { React });

    return Component;
  } catch {
    return (() => <div />) as ComponentType;
  }
};

export const evalCode = (code: string, scope: Record<string, unknown>): ComponentType => {
  const scopeKeys = Object.keys(scope);
  const scopeValues = scopeKeys.map((key) => scope[key]);
  return new Function(...scopeKeys, code)(...scopeValues);
};

const defaultTransforms: Transform[] = ['jsx', 'imports'];

type Options = {
  transforms?: Transform[];
};

function transform(opts: Options = {}) {
  const transforms = Array.isArray(opts.transforms)
    ? opts.transforms.filter(Boolean)
    : defaultTransforms;

  return (code: string) => {
    console.log('CODE: ', code);
    return _transform(code, { transforms }).code;
  };
}

export function compose<T>(...functions: ((...args: T[]) => T)[]) {
  return functions.reduce(
    (acc, currentFn) =>
      (...args: T[]) =>
        acc(currentFn(...args)),
  );
}
