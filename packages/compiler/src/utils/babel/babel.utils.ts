import { parse } from '@babel/parser';
import type { Binding, NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import * as RA from 'effect/Array';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import type { AnyPrimitive } from '@native-twin/helpers';
import { JSXChildElement, JSXMappedAttribute } from '../../models/jsx.models.js';
import {
  createCommonMappedAttribute,
  MappedComponent,
  mappedComponents,
} from '../../shared/compiler.constants.js';
import * as babelPredicates from './babel.predicates.js';

export const getJSXElementName = (
  openingElement: t.JSXOpeningElement,
): Option.Option<string> => {
  if (t.isJSXIdentifier(openingElement.name)) {
    return Option.some(openingElement.name.name);
  }
  return Option.none();
};

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

export const getBabelBindingImportSource = (binding: Binding) =>
  Option.firstSomeOf([
    getBindingImportDeclaration(binding),
    getBindingRequireDeclaration(binding),
  ]);

const getBindingImportDeclaration = (binding: Binding) =>
  Option.liftPredicate(binding.path, babelPredicates.isImportSpecifier).pipe(
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
  Option.liftPredicate(binding.path, babelPredicates.isVariableDeclaratorPath).pipe(
    Option.bindTo('importSpecifier'),
    Option.bind('requireExpression', ({ importSpecifier }) =>
      Option.fromNullable(importSpecifier.node.init).pipe(
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

export const getBabelAST = (code: string, filename: string) => {
  const ast = parse(code, {
    sourceFilename: filename,
    plugins: ['jsx', 'typescript'],
    sourceType: 'module',
    errorRecovery: true,
    startLine: 0,
    startColumn: 1,
    tokens: false,
    ranges: true,
  });
  return ast;
};

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

/**
 * @domain Babel
 * @description Extract the {@link t.JSXAttribute[]} from any {@link t.JSXElement}
 * */
export const getJSXElementAttrs = (element: t.JSXElement): t.JSXAttribute[] =>
  RA.filter(element.openingElement.attributes, babelPredicates.isJSXAttribute);

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
    (node) =>
      [
        babelPredicates.isReactRequire(node),
        babelPredicates.isReactInteropRequire(node),
      ] as const,
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

/**
 * @category Transformer
 * @domain Babel
 * Extract {@link JSXMappedAttribute[]} list from a jsx Attribute
 * */
export const extractMappedAttributes = (node: t.JSXElement): JSXMappedAttribute[] => {
  const attributes = getJSXElementAttrs(node);
  return Option.fromNullable(
    node.openingElement.name.type === 'JSXIdentifier'
      ? node.openingElement.name.name
      : undefined,
  ).pipe(
    Option.flatMap((x) => Option.fromNullable(getJSXElementConfig(x))),
    Option.map((mapped) => getJSXMappedAttributes(attributes, mapped)),
    Option.getOrElse(() => []),
  );
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
    RA.map(attributes, (x) => extractStyledProp(x, config)),
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
