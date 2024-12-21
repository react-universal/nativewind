import { template } from '@babel/core';
import { CodeGenerator } from '@babel/generator';
import * as t from '@babel/types';
import type { RuntimeTW } from '@native-twin/core';
import {
  type CompilerContext,
  type RuntimeComponentEntry,
  RuntimeSheetEntry,
  getGroupedEntries,
  sortSheetEntries,
} from '@native-twin/css/jsx';
import * as RA from 'effect/Array';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import type { JSXElementNodePath, JSXMappedAttribute } from '../../models/Babel.models.js';
import type {  } from '../../models/jsx.models.js';
import {
  getBabelBindingImportSource,
  getJSXElementName,
  templateLiteralToStringLike,
} from './babel.utils.js';

// TODO: REMOVE ONCE NEW SERVICE FINISH
export const getElementEntries = (
  props: JSXMappedAttribute[],
  twin: RuntimeTW,
  ctx: CompilerContext,
): RuntimeComponentEntry[] => {
  return RA.map(props, ({ value, prop, target }): RuntimeComponentEntry => {
    let classNames = '';
    let templateExpression: null | string = null;
    if (t.isStringLiteral(value)) {
      classNames = value.value;
    } else {
      const cooked = templateLiteralToStringLike(value);
      classNames = cooked.strings;
      const generate = new CodeGenerator(cooked.expressions);
      templateExpression = generate.generate().code;
    }

    const entries = twin(classNames);
    const runtimeEntries = pipe(
      RA.dedupeWith(entries, (a, b) => a.className === b.className),
      RA.map((x) => new RuntimeSheetEntry(x, ctx)),
      sortSheetEntries,
    );

    return {
      classNames,
      prop,
      target,
      templateLiteral: templateExpression,
      entries: runtimeEntries,
      templateEntries: [],
      // childEntries: pipe(
      //   runtimeEntries,
      //   RA.filter((x) => isChildEntry(x)),
      // ),
      rawSheet: getGroupedEntries(runtimeEntries),
    };
  });
};

export const getJSXElementSource = (path: JSXElementNodePath) =>
  getJSXElementName(path.node.openingElement).pipe(
    Option.flatMap((x) => Option.fromNullable(path.scope.getBinding(x))),
    Option.flatMap((binding) => getBabelBindingImportSource(binding)),
    Option.getOrElse(() => ({ kind: 'local', source: 'unknown' })),
  );

export const runtimeEntriesToAst = (entries: string) => {
  const ast = template.ast(entries);
  try {
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
