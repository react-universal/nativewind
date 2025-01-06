import { type NodePath, traverse } from '@babel/core';
import { parse } from '@babel/parser';
import * as t from '@babel/types';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Stream from 'effect/Stream';

export interface BabelLanguageRegionData {
  location: Option.Option<t.SourceLocation>;
  path:
    | NodePath<t.CallExpression>
    | NodePath<t.TaggedTemplateExpression>
    | NodePath<t.JSXAttribute>;
}
export const traverseLanguageRegions = (
  code: string,
  config: {
    functions: string[];
    jsxAttributes: string[];
  },
) =>
  Effect.try(() => {
    const ast = parse(code, {
      plugins: ['jsx', 'typescript'],
      sourceType: 'module',
      errorRecovery: true,
      startLine: 0,
      startColumn: 1,
      tokens: false,
      ranges: true,
    });

    const babelRegions = Stream.async<BabelLanguageRegionData>((emit) => {
      traverse(ast, {
        Program: {
          exit() {
            emit.end();
          },
        },
        CallExpression: (path) => {
          const callee = path.get('callee');

          if (callee.isIdentifier() && config.functions.includes(callee.node.name)) {
            emit.single({
              location: Option.fromNullable(path.node.loc),
              path,
            });
          }
        },
        TaggedTemplateExpression: (path) => {
          if (
            t.isIdentifier(path.node.tag) &&
            config.functions.includes(path.node.tag.name) &&
            path.node.quasi.quasis
          ) {
            emit.single({
              location: Option.fromNullable(path.node.loc),
              path,
            });
          }
        },
        JSXAttribute: (path) => {
          if (
            t.isJSXIdentifier(path.node.name) &&
            config.jsxAttributes.includes(path.node.name.name) &&
            path.node.value
          ) {
            if (t.isStringLiteral(path.node.value)) {
              emit.single({
                location: Option.fromNullable(path.node.loc),
                path,
              });
            }
            if (
              t.isJSXExpressionContainer(path.node.value) &&
              t.isTemplateLiteral(path.node.value.expression)
            ) {
              emit.single({
                location: Option.fromNullable(path.node.loc),
                path,
              });
            }

            if (
              t.isJSXExpressionContainer(path.node.value) &&
              t.isStringLiteral(path.node.value.expression)
            ) {
              emit.single({
                location: Option.fromNullable(path.node.loc),
                path,
              });
            }
          }
        },
      });
    });

    return {
      ast,
      babelRegions,
    };
  });

export const extractLanguageRegions = (
  code: string,
  config: {
    functions: string[];
    jsxAttributes: string[];
  },
): t.SourceLocation[] => {
  const sourceLocations: t.SourceLocation[] = [];
  try {
    const parsed = parse(code, {
      plugins: ['jsx', 'typescript'],
      sourceType: 'module',
      errorRecovery: true,
      startLine: 0,
      startColumn: 1,
      tokens: false,
      ranges: true,
    });
    traverse(parsed, {
      CallExpression: (path) => {
        const sources: t.SourceLocation[] = [];
        const callee = path.get('callee');
        if (
          callee.isIdentifier() &&
          // t.isIdentifier(path.node.callee) &&
          config.functions.includes(callee.node.name)
        ) {
          for (const arg of path.node.arguments) {
            if (t.isObjectExpression(arg)) {
              sources.push(...matchVariantsObject(arg.properties));
            }
          }
        }
        sourceLocations.push(...sources);
      },
      TaggedTemplateExpression: (path) => {
        if (
          t.isIdentifier(path.node.tag) &&
          config.functions.includes(path.node.tag.name) &&
          path.node.quasi.quasis
        ) {
          sourceLocations.push(...templateExpressionMatcher(path.node.quasi.quasis));
        }
      },
      JSXAttribute: (path) => {
        if (
          t.isJSXIdentifier(path.node.name) &&
          config.jsxAttributes.includes(path.node.name.name) &&
          path.node.value
        ) {
          if (t.isStringLiteral(path.node.value) && path.node.value.loc) {
            sourceLocations.push(path.node.value.loc);
          }
          if (
            t.isJSXExpressionContainer(path.node.value) &&
            t.isTemplateLiteral(path.node.value.expression)
          ) {
            sourceLocations.push(
              ...templateExpressionMatcher(path.node.value.expression.quasis),
            );
          }

          if (
            t.isJSXExpressionContainer(path.node.value) &&
            t.isStringLiteral(path.node.value.expression) &&
            path.node.value.expression.loc
          ) {
            sourceLocations.push(path.node.value.expression.loc);
          }
        }
      },
    });

    return sourceLocations;
  } catch (e) {
    return sourceLocations;
  }
};

const matchVariantsObject = (
  properties: t.ObjectExpression['properties'],
  results: t.SourceLocation[] = [],
): t.SourceLocation[] => {
  const nextProperty = properties.shift();
  if (!nextProperty) return results;

  if (t.isObjectProperty(nextProperty)) {
    if (t.isStringLiteral(nextProperty.value) && nextProperty.value.loc) {
      results.push(nextProperty.value.loc);
    }

    if (t.isTemplateLiteral(nextProperty.value)) {
      results.push(...templateExpressionMatcher(nextProperty.value.quasis, results));
    }

    if (t.isObjectExpression(nextProperty.value)) {
      return matchVariantsObject(nextProperty.value.properties, results);
    }
  }

  return matchVariantsObject(properties, results);
};

const templateExpressionMatcher = (
  node: t.TemplateElement[],
  results: t.SourceLocation[] = [],
): t.SourceLocation[] => {
  const nextToken = node.shift();
  if (!nextToken) return results;

  if (nextToken.loc) {
    results.push(nextToken.loc);
  }

  return templateExpressionMatcher(node, results);
};
