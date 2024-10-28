import type { NodePath, Binding } from '@babel/traverse';
import * as t from '@babel/types';
import * as RA from 'effect/Array';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import type { AnyPrimitive } from '@native-twin/helpers';
import type { JSXChildElement } from '../models/jsx.models';
import type { JSXElementNodePath } from '../models/jsx.models';
import {
  isJSXAttribute,
  isReactInteropRequire,
  isReactRequire,
} from './babel.predicates';
import {
  createPrimitiveExpression,
  getBindingImportSource,
  maybeBinding,
  maybeCallExpression,
  maybeImportDeclaration,
  maybeVariableDeclarator,
} from './babel.utils';

const createJsxAttribute = (name: string, value: AnyPrimitive) => {
  const expression = createPrimitiveExpression(value);
  return t.jsxAttribute(t.jsxIdentifier(name), t.jsxExpressionContainer(expression));
};

const JSXElementHasAttribute = (element: t.JSXElement, name: string) => {
  return element.openingElement.attributes.some(
    (x) =>
      x.type === 'JSXAttribute' &&
      x.name.type === 'JSXIdentifier' &&
      x.name.name === name,
  );
};

export const addJsxAttribute = (
  element: JSXChildElement,
  name: string,
  value: AnyPrimitive,
) => {
  if (!t.isJSXElement(element)) return;
  const newAttribute = createJsxAttribute(name, value);
  if (!JSXElementHasAttribute(element, name)) {
    return element.openingElement.attributes.push(newAttribute);
  }

  element.openingElement.attributes = element.openingElement.attributes.map((x) => {
    if (x.type === 'JSXSpreadAttribute') return x;
    if (
      x.type === 'JSXAttribute' &&
      x.name.type === 'JSXIdentifier' &&
      x.name.name === name
    ) {
      return newAttribute;
    }
    return x;
  });

  return;
};

export const addJsxExpressionAttribute = (
  element: JSXChildElement,
  name: string,
  value: t.Expression,
) => {
  if (!t.isJSXElement(element)) return;
  const newAttribute = t.jsxAttribute(
    t.jsxIdentifier(name),
    t.jsxExpressionContainer(value),
  );

  if (JSXElementHasAttribute(element, name)) {
    console.log('ALREADY_HAS: ', name);
    element.openingElement.attributes = element.openingElement.attributes.map((x) => {
      if (x.type === 'JSXSpreadAttribute') return x;
      if (
        x.type === 'JSXAttribute' &&
        x.name.type === 'JSXIdentifier' &&
        x.name.name === name
      ) {
        return newAttribute;
      }
      return x;
    });
    return;
  }

  element.openingElement.attributes.push(newAttribute);
};

export const getJSXElementName = (
  openingElement: t.JSXOpeningElement,
): Option.Option<string> => {
  if (t.isJSXIdentifier(openingElement.name)) {
    return Option.some(openingElement.name.name);
  }
  return Option.none();
};

/**
 * @domain Babel
 * @description Extract the {@link t.JSXAttribute[]} from any {@link t.JSXElement}
 * */
export const getJSXElementAttrs = (element: t.JSXElement): t.JSXAttribute[] =>
  pipe(element.openingElement.attributes, RA.filter(isJSXAttribute));

export const getJSXElementSource = (path: JSXElementNodePath) =>
  pipe(
    getJSXElementName(path.node.openingElement),
    Option.flatMap((x) => Option.fromNullable(path.scope.getBinding(x))),
    Option.flatMap((binding) => getBindingImportSource(binding)),
    Option.getOrElse(() => ({ kind: 'local', source: 'unknown' })),
  );

export const maybeReactCreateElementExpression = (
  path: NodePath<t.MemberExpression>,
): Option.Option<t.MemberExpression> => {
  if (t.isIdentifier(path.node.property, { name: 'createElement' })) {
    return Option.some(path.node);
  }
  return Option.none();
};

export const maybeReactIdent = (node: Option.Option<t.MemberExpression>) =>
  Option.flatMap(node, (x) => {
    if (
      t.isIdentifier(x.object, { name: 'react' }) ||
      t.isIdentifier(x.object, { name: 'React' })
    ) {
      return Option.some(x.object);
    }
    if (
      t.isMemberExpression(x.object) &&
      t.isIdentifier(x.object.object, { name: '_react' }) &&
      t.isIdentifier(x.object.property, { name: 'default' })
    ) {
      return Option.some(x.object.object);
    }
    return Option.none();
  });

export const maybeBindingIsReactImport = (x: Option.Option<Binding>) =>
  x.pipe(
    maybeVariableDeclarator,
    maybeCallExpression,
    (node) => [isReactRequire(node), isReactInteropRequire(node)] as const,
    Option.firstSomeOf,
  );

export const isReactImport = (x: Binding) => {
  if (
    x.path.isImportSpecifier() ||
    x.path.isImportDefaultSpecifier() ||
    x.path.isImportDeclaration() ||
    x.path.isImportNamespaceSpecifier()
  ) {
    return (
      t.isImportDeclaration(x.path.parentPath.node) &&
      x.path.parentPath.node.source.value.toLowerCase() === 'react'
    );
  }

  return false;
};

export const isReactRequireBinding = (x: Binding) => {
  if (x.path.isVariableDeclarator() && t.isCallExpression(x.path.node.init)) {
    if (
      t.isIdentifier(x.path.node.init.callee, { name: 'require' }) &&
      t.isStringLiteral(x.path.node.init.arguments[0], { value: 'react' })
    ) {
      return true;
    } else if (
      // const <name> = _interopRequireDefault(require("react"))
      t.isIdentifier(x.path.node.init.callee, { name: '_interopRequireDefault' }) &&
      t.isCallExpression(x.path.node.init.arguments[0]) &&
      t.isIdentifier(x.path.node.init.arguments[0].callee, { name: 'require' }) &&
      t.isStringLiteral(x.path.node.init.arguments[0].arguments[0], {
        value: 'react',
      })
    ) {
      return true;
    }
  }

  return false;
};

export const memberExpressionIsReactImport = (path: NodePath<t.MemberExpression>) =>
  maybeReactCreateElementExpression(path).pipe(
    maybeReactIdent,
    (x) => maybeBinding(x, path),
    (x) => [maybeBindingIsReactImport(x), maybeImportDeclaration(x)] as const,
    Option.firstSomeOf,
    Option.getOrElse(() => false),
  );

export const identifierIsReactImport = (path: NodePath<t.Identifier>) => {
  if (path.node.name === 'createElement' && path.parentPath.isCallExpression()) {
    return Option.fromNullable(path.scope.getBinding(path.node.name)).pipe(
      Option.map((x) => isReactRequireBinding(x) || isReactImport(x)),
      Option.getOrElse(() => false),
    );
  }
  return false;
};
