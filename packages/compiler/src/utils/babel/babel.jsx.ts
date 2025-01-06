import { template } from '@babel/core';
import * as t from '@babel/types';
import * as Option from 'effect/Option';
import type { JSXElementNodePath } from '../../models/Babel.models.js';
import { getBabelBindingImportSource, getJSXElementName } from './babel.utils.js';

export const getJSXElementSource = (path: JSXElementNodePath) =>
  getJSXElementName(path.node.openingElement).pipe(
    Option.flatMap((x) => Option.fromNullable(path.scope.getBinding(x))),
    Option.flatMap((binding) => getBabelBindingImportSource(binding)),
    Option.getOrElse(() => ({ kind: 'local', source: 'unknown' })),
  );

export const runtimeEntriesToAst = (entries: string) => {
  try {
    const ast = template.ast(entries);
    let value: t.Expression | undefined;
    if (Array.isArray(ast)) return;

    if (t.isExpressionStatement(ast)) {
      value = ast.expression;
    }

    if (t.isBlockStatement(ast)) {
      const firstBlock = ast.body[0];
      if (t.isExpression(firstBlock)) {
        value = firstBlock;
      }
      if (t.isExpressionStatement(firstBlock)) {
        value = firstBlock.expression;
      }
    }

    if (!value) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
};
