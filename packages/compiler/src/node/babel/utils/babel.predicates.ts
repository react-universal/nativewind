import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import * as Predicate from 'effect/Predicate';

export const isJSXElement: Predicate.Predicate<t.JSXElement> = pipe(
  (node: t.Node): node is t.JSXElement => t.isJSXElement(node),
  Predicate.mapInput((node: t.Node) => node),
);

export const isJSXElementNode: Predicate.Refinement<t.Node, t.JSXElement> = (
  node: t.Node,
): node is t.JSXElement => t.isJSXElement(node);

export const isCallExpression: Predicate.Refinement<unknown, t.CallExpression> = (
  node: unknown,
): node is t.CallExpression => t.isNode(node) && t.isCallExpression(node);

export const isVariableDeclaratorPath: Predicate.Refinement<
  NodePath,
  NodePath<t.VariableDeclarator>
> = (path: NodePath): path is NodePath<t.VariableDeclarator> =>
  path.isVariableDeclarator();

export const variableDeclaratorIsRequire: Predicate.Refinement<
  NodePath,
  NodePath<t.CallExpression>
> = pipe((path: NodePath): path is NodePath<t.CallExpression> => path.isCallExpression());

export const isImportSpecifier: Predicate.Refinement<
  NodePath,
  NodePath<t.ImportSpecifier>
> = pipe((path: NodePath<t.Node>): path is NodePath<t.ImportSpecifier> =>
  path.isImportSpecifier(),
);

export const isImportDeclaration: Predicate.Refinement<
  NodePath,
  NodePath<t.ImportDeclaration>
> = pipe((path: NodePath<t.Node>): path is NodePath<t.ImportDeclaration> =>
  path.isImportDeclaration(),
);

export const isJSXElementPath: Predicate.Refinement<
  NodePath<t.Node>,
  NodePath<t.JSXElement>
> = (node): node is NodePath<t.JSXElement> => node.isJSXElement();

export const isJSXAttribute: Predicate.Refinement<t.Node, t.JSXAttribute> = (
  node,
): node is t.JSXAttribute => t.isJSXAttribute(node);

export const isJSXAttributePath: Predicate.Refinement<
  NodePath<t.Node>,
  NodePath<t.JSXAttribute>
> = (node): node is NodePath<t.JSXAttribute> => node.isJSXAttribute();

export const isReactRequire = (
  node: Option.Option<readonly [t.VariableDeclarator, t.CallExpression]>,
) =>
  Option.filterMap(node, ([, node]) =>
    t.isIdentifier(node.callee, { name: 'require' }) &&
    t.isStringLiteral(node.arguments[0], { value: 'react' })
      ? Option.some(true)
      : Option.none(),
  );

export const isReactInteropRequire = (
  node: Option.Option<readonly [t.VariableDeclarator, t.CallExpression]>,
) =>
  Option.flatMap(node, ([, node]) => {
    if (
      // const <name> = _interopRequireDefault(require("react"))
      t.isIdentifier(node.callee, { name: '_interopRequireDefault' }) &&
      t.isCallExpression(node.arguments[0]) &&
      t.isIdentifier(node.arguments[0].callee, { name: 'require' }) &&
      t.isStringLiteral(node.arguments[0].arguments[0], {
        value: 'react',
      })
    ) {
      return Option.some(true);
    }
    return Option.none();
  });
