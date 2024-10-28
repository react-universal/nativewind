import template from '@babel/template';
import * as t from '@babel/types';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import { applyParentEntries } from '@native-twin/css/jsx';
import type { Tree } from '@native-twin/helpers/tree';
import {
  createCommonMappedAttribute,
  mappedComponents,
  type MappedComponent,
} from '../../../shared';
import { NativeTwinServiceNode } from '../../native-twin';
import { JSXElementNode, JSXElementTree, type JSXMappedAttribute } from '../models';
import { getJSXElementAttrs, getJSXElementName } from './jsx.utils';

/**
 * @domain Babel
 * @description Extract the {@link JSXMappedAttribute} from any {@link t.JSXAttribute}
 * */
export const extractStyledProp = (
  attribute: t.JSXAttribute,
  config: MappedComponent,
): JSXMappedAttribute | null => {
  const validClassNames = Object.entries(config.config);
  if (!t.isJSXAttribute(attribute)) return null;
  if (!t.isJSXIdentifier(attribute.name)) return null;
  const className = validClassNames.find((x) => attribute.name.name === x[0]);
  if (!className) return null;

  if (t.isStringLiteral(attribute.value)) {
    return {
      prop: className[0],
      target: className[1],
      value: attribute.value,
    };
  }
  if (t.isJSXExpressionContainer(attribute.value)) {
    if (t.isTemplateLiteral(attribute.value.expression)) {
      return {
        prop: className[0],
        target: className[1],
        value: attribute.value.expression,
      };
    }
    if (t.isCallExpression(attribute.value.expression)) {
      return {
        prop: className[0],
        target: className[1],
        value: t.templateLiteral(
          [
            t.templateElement({ raw: '', cooked: '' }),
            t.templateElement({ raw: '', cooked: '' }),
          ],
          [attribute.value.expression],
        ),
      };
    }
  }
  return null;
};

/**
 * @internal
 * @category Transformer
 * @domain Babel
 * Extract {@link JSXMappedAttribute[]} list from a jsx Attribute
 * */
const getJSXMappedAttributes = (
  attributes: t.JSXAttribute[],
  config: MappedComponent,
): JSXMappedAttribute[] => {
  return pipe(
    attributes,
    RA.map((x) => extractStyledProp(x, config)),
    RA.filterMap((x) => Option.fromNullable(x)),
    (data) => {
      if (RA.isNonEmptyArray(data)) {
        return data;
      }
      return Object.entries(config.config).map(
        ([prop, target]): JSXMappedAttribute => ({
          prop,
          target,
          value: t.stringLiteral(''),
        }),
      );
    },
  );
};

/**
 * * @internal
 * @domain Babel
 * @description Extract the {@link MappedComponent} from any {@link ValidJSXElementNode}
 * */
const getJSXElementConfig = (tagName: string) => {
  const componentConfig = mappedComponents.find((x) => x.name === tagName);
  if (!componentConfig) return createCommonMappedAttribute(tagName);

  return componentConfig;
};

/**
 * @category Transformer
 * @domain Babel
 * Extract {@link JSXMappedAttribute[]} list from a jsx Attribute
 * */
export const extractMappedAttributes = (node: t.JSXElement): JSXMappedAttribute[] => {
  const attributes = getJSXElementAttrs(node);
  return pipe(
    getJSXElementName(node.openingElement),
    Option.flatMap((x) => Option.fromNullable(getJSXElementConfig(x))),
    Option.map((mapped) => getJSXMappedAttributes(attributes, mapped)),
    Option.getOrElse(() => []),
  );
};

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

export const extractSheetsFromTree = (tree: Tree<JSXElementTree>, fileName: string) =>
  Effect.gen(function* () {
    const twin = yield* NativeTwinServiceNode;
    const fileSheet = RA.empty<[string, JSXElementNode]>();

    tree.traverse((leave) => {
      const { value } = leave;
      const runtimeData = extractMappedAttributes(leave.value.babelNode);
      const model = new JSXElementNode({
        leave,
        order: value.order,
        filename: fileName,
        runtimeData,
        twin,
      });
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
