import { template } from '@babel/core';
import { CodeGenerator } from '@babel/generator';
import * as t from '@babel/types';
import type { RuntimeTW } from '@native-twin/core';
import {
  type CompilerContext,
  type RuntimeComponentEntry,
  applyParentEntries,
  compileSheetEntry,
  getGroupedEntries,
  sortSheetEntries,
} from '@native-twin/css/jsx';
import * as RA from 'effect/Array';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import type { JSXElementNodePath } from '../../models/Babel.models.js';
import type { JSXElementNode } from '../../models/JSXElement.model.js';
import type { JSXMappedAttribute } from '../../models/jsx.models.js';
import {
  addJsxAttribute,
  addJsxExpressionAttribute,
  getBabelBindingImportSource,
  getJSXElementName,
  templateLiteralToStringLike,
} from './babel.utils.js';
import { entriesToComponentData } from './code.utils.js';

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
      RA.map((x) => compileSheetEntry(x, ctx)),
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

export const getJSXCompiledTreeRuntime = (
  leave: JSXElementNode,
  parentLeave: Option.Option<JSXElementNode>,
) => {
  const runtimeSheets = pipe(
    parentLeave,
    Option.map((parent) =>
      applyParentEntries(
        leave.entries,
        parent.childEntries,
        leave.order,
        leave.parentSize,
      ),
    ),
    Option.getOrElse(() => leave.entries),
  );

  return {
    leave,
    runtimeSheets,
  };
};

export const addTwinPropsToElement = (
  elementNode: JSXElementNode,
  entries: RuntimeComponentEntry[],
  options: {
    componentID: boolean;
    order: boolean;
    styledProps: boolean;
    templateStyles: boolean;
  },
) => {
  const stringEntries = entriesToComponentData(elementNode.id, entries);
  const astProps = runtimeEntriesToAst(stringEntries);

  if (options.componentID) {
    addJsxAttribute(elementNode.path, '_twinComponentID', elementNode.id);
  }

  if (options.order) {
    addJsxAttribute(elementNode.path, '_twinOrd', elementNode.order);
  }

  if (options.styledProps && astProps) {
    addJsxExpressionAttribute(elementNode.path, '_twinComponentSheet', astProps);
  }
  return astProps;
};
