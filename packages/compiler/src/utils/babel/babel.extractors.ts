import { traverse } from '@babel/core';
import * as t from '@babel/types';
import * as babelPredicates from './babel.predicates';
import { getBabelAST } from './babel.utils';

export const extractLanguageRegions = (
  code: string,
  config: {
    functions: string[];
    jsxAttributes: string[];
  },
): t.SourceLocation[] => {
  const sourceLocations: t.SourceLocation[] = [];
  try {
    const parsed = getBabelAST(code, 'any_file');

    traverse(parsed, {
      CallExpression: (path) => {
        const sources: t.SourceLocation[] = [];
        if (
          t.isIdentifier(path.node.callee) &&
          config.functions.includes(path.node.callee.name)
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
          config.functions.includes(path.node.tag.name)
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
        }
      },
    });

    return sourceLocations;
  } catch {
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

    if (babelPredicates.isObjectExpression(nextProperty.value)) {
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
