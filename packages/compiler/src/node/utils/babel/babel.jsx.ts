import generate from '@babel/generator';
import template from '@babel/template';
import * as t from '@babel/types';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import type { RuntimeTW } from '@native-twin/core';
import {
  applyParentEntries,
  compileSheetEntry,
  getGroupedEntries,
  sortSheetEntries,
  type CompilerContext,
  type RuntimeComponentEntry,
} from '@native-twin/css/jsx';
import type { Tree, TreeNode } from '@native-twin/helpers/tree';
import type { JSXElementNodePath, JSXElementTree } from '../../models/Babel.models.js';
import { JSXElementNode } from '../../models/JSXElement.model.js';
import type { JSXMappedAttribute } from '../../models/jsx.models.js';
import { TwinNodeContext } from '../../services/TwinNodeContext.service.js';
import {
  addJsxAttribute,
  addJsxExpressionAttribute,
  extractMappedAttributes,
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
      templateExpression = generate(cooked.expressions).code;
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

export const extractSheetsFromTree = (
  tree: Tree<JSXElementTree>,
  fileName: string,
  platform: string,
) =>
  Effect.gen(function* () {
    const twin = yield* TwinNodeContext;
    const tw = yield* twin.getTwForPlatform(platform);
    const fileSheet = RA.empty<[string, JSXElementNode]>();

    tree.traverse((leave) => {
      const runtimeData = extractMappedAttributes(leave.value.babelNode);
      const entries = getElementEntries(runtimeData, tw, {
        baseRem: tw.config.root.rem ?? 16,
        platform,
      });
      const model = jsxTreeNodeToJSXElementNode(leave, entries, fileName);

      fileSheet.push([model.id, model]);
    }, 'breadthFirst');

    return fileSheet;
  });

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

export function addTwinPropsToElement(
  elementNode: JSXElementNode,
  entries: RuntimeComponentEntry[],
  options: {
    componentID: boolean;
    order: boolean;
    styledProps: boolean;
    templateStyles: boolean;
  },
) {
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
}

export const jsxTreeNodeToJSXElementNode = (
  leave: TreeNode<JSXElementTree>,
  entries: RuntimeComponentEntry[],
  filename: string,
): JSXElementNode => {
  const runtimeData = extractMappedAttributes(leave.value.babelNode);
  return new JSXElementNode({
    leave,
    order: leave.value.order,
    filename,
    runtimeData,
    entries,
  });
};
