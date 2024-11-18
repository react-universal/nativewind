import { packages } from '@babel/standalone';
import type * as types from '@babel/types';

const traverse = packages.traverse;

const t = packages.types;

export const extractLanguageRegions = (
  code: string,
  config: {
    functions: string[];
    jsxAttributes: string[];
  },
): types.SourceLocation[] => {
  const sourceLocations: types.SourceLocation[] = [];
  try {
    const parsed = packages.parser.parse(code, {
      plugins: ['jsx', 'typescript'],
      sourceType: 'module',
      errorRecovery: true,
      startLine: 0,
      startColumn: 1,
      tokens: false,
      ranges: true,
    });
    traverse.default(parsed, {
      CallExpression: (path) => {
        const sources: types.SourceLocation[] = [];
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
    console.log('ERROR: ', e);
    return sourceLocations;
  }
};

const matchVariantsObject = (
  properties: types.ObjectExpression['properties'],
  results: types.SourceLocation[] = [],
): types.SourceLocation[] => {
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
  node: types.TemplateElement[],
  results: types.SourceLocation[] = [],
): types.SourceLocation[] => {
  const nextToken = node.shift();
  if (!nextToken) return results;

  if (nextToken.loc) {
    results.push(nextToken.loc);
  }

  return templateExpressionMatcher(node, results);
};
