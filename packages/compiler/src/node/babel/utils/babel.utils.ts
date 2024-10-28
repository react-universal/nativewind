import type { Binding, NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import * as RA from 'effect/Array';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import type { AnyPrimitive } from '@native-twin/helpers';
import * as babelPredicates from './babel.predicates';

export const createPrimitiveExpression = <T extends AnyPrimitive>(value: T) => {
  if (typeof value === 'string') return t.stringLiteral(value);
  if (typeof value === 'number') return t.numericLiteral(value);
  return t.booleanLiteral(value);
};

export const createRequireExpression = (path: string) => {
  return t.callExpression(t.identifier('require'), [t.stringLiteral(path)]);
};

export const templateLiteralToStringLike = (literal: t.TemplateLiteral) => {
  const strings = literal.quasis
    .map((x) => (x.value.cooked ? x.value.cooked : x.value.raw))
    .map((x) => x.trim().replace(/\n/g, '').trim().replace(/\s+/g, ' '))
    .filter((x) => x.length > 0)
    .join('');
  const expressions = t.templateLiteral(
    literal.quasis.map(() => t.templateElement({ raw: '', cooked: '' })),
    literal.expressions,
  );
  return { strings, expressions: expressions };
};

export const getBindingImportSource = (binding: Binding) =>
  pipe(
    [getBindingImportDeclaration(binding), getBindingRequireDeclaration(binding)],
    Option.firstSomeOf,
  );

const getBindingImportDeclaration = (binding: Binding) =>
  pipe(
    binding.path,
    Option.liftPredicate(babelPredicates.isImportSpecifier),
    Option.bindTo('importSpecifier'),
    Option.bind('importDeclaration', ({ importSpecifier }) =>
      Option.liftPredicate(
        importSpecifier.parentPath,
        babelPredicates.isImportDeclaration,
      ),
    ),
    Option.map((source) => ({
      kind: 'import',
      source: source.importDeclaration.node.source.value,
    })),
  );

const getBindingRequireDeclaration = (binding: Binding) =>
  pipe(
    binding.path,
    Option.liftPredicate(babelPredicates.isVariableDeclaratorPath),
    Option.bindTo('importSpecifier'),
    Option.bind('requireExpression', ({ importSpecifier }) =>
      pipe(
        Option.fromNullable(importSpecifier.node.init),
        Option.flatMap((init) =>
          Option.liftPredicate(init, babelPredicates.isCallExpression),
        ),
        Option.flatMap((x) => RA.head(x.arguments)),
        Option.flatMap((x) => Option.liftPredicate(x, t.isStringLiteral)),
      ),
    ),
    Option.map((source) => {
      return {
        kind: 'require',
        source: source.requireExpression.value,
      };
    }),
  );

export const maybeBinding = (
  node: Option.Option<t.Identifier>,
  path: NodePath<t.MemberExpression>,
) => {
  return node.pipe(
    Option.flatMap((a) => Option.fromNullable(path.scope.getBinding(a.name))),
  );
};

export const maybeImportDeclaration = (binding: Option.Option<Binding>) => {
  return Option.flatMap(binding, (x) =>
    x.path.parentPath &&
    t.isImportDeclaration(x.path.parentPath.node) &&
    x.path.parentPath.node.source.value.toLowerCase() === 'react'
      ? Option.some(true)
      : Option.none(),
  );
};

export const maybeCallExpression = (node: Option.Option<t.VariableDeclarator>) => {
  return Option.flatMap(node, (x) =>
    t.isCallExpression(x.init) ? Option.some([x, x.init] as const) : Option.none(),
  );
};

export const maybeVariableDeclarator = (binding: Option.Option<Binding>) => {
  return Option.flatMap(binding, (x) =>
    x.path.isVariableDeclarator() ? Option.some(x.path.node) : Option.none(),
  );
};
