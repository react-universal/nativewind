import type ts from 'typescript/lib/tsserverlibrary';
import type { NativeTwinPluginConfiguration } from '../plugin.types';

export type Predicate =
  | ((
      this: undefined,
      value: any,
      key: undefined,
      object: any,
      matcher: undefined,
    ) => unknown)
  | (<T extends Predicates>(
      this: T,
      value: any,
      key: string,
      object: any,
      matcher: T,
    ) => unknown);

export interface RegExpLike {
  /**
   * Returns a Boolean value that indicates whether or not a pattern exists in a searched string.
   * @param string String on which to perform the search.
   */
  test(string: string): boolean;
}

export type Matcher = Predicate | Predicates | RegExp | unknown;

/**
 * Defines the predicate properties to be invoked with the corresponding property values of a given object.
 */
export interface Predicates
  extends Record<string | number | symbol, Matcher | Matcher[]> {
  // Support cyclic references
}

export function match(
  value: unknown,
  predicate: Matcher,
  key?: string | undefined,
  object?: unknown,
  matcher?: Matcher | Matcher[],
): boolean {
  if (isEqual(value, predicate)) {
    return true;
  }

  if (Array.isArray(predicate)) {
    return predicate.some((item) => match(value, item, key, object, matcher));
  }

  if (typeof predicate === 'function') {
    return Boolean(predicate.call(matcher, value, key, object, matcher));
  }

  if (typeof value === 'string' && isRegExpLike(predicate)) {
    return predicate.test(value);
  }

  if (isObjectLike(value) && isObjectLike(predicate)) {
    return Object.keys(predicate).every((key) =>
      match((value as any)[key], (predicate as any)[key], key, value, predicate),
    );
  }

  return false;
}

/**
 * Performs a [SameValueZero](https://ecma-international.org/ecma-262/7.0/#sec-samevaluezero) comparison
 * between two values to determine if they are equivalent.
 *
 * **Note** SameValueZero differs from SameValue only in its treatment of `+0` and `-0`.
 * For SameValue comparison use `Object.is()`.
 */
function isEqual(value: unknown, other: unknown): boolean {
  return value === other || (Number.isNaN(value) && Number.isNaN(other));
}

/**
 * Return `true` if `value` is an object-like.
 *
 * A value is object-like if it's not `null` and has a `typeof` result of `"object"`.
 *
 * **Note** Keep in mind that functions are objects too.
 *
 * @param value to check
 */
function isObjectLike(value: unknown): value is object {
  return value != null && typeof value === 'object';
}

function isRegExpLike(value: unknown): value is RegExpLike {
  return isObjectLike(value) && typeof (value as RegExp).test === 'function';
}

export const getSourceMatchers = (
  { SyntaxKind }: typeof ts,
  configManager: NativeTwinPluginConfiguration,
): Matcher[] => [
  // tw`...`
  {
    kind: SyntaxKind.TaggedTemplateExpression,
    // https://github.com/microsoft/typescript-template-language-service-decorator/blob/main/src/nodes.ts#L62
    // TODO styled.button, styled()
    tag: {
      kind: SyntaxKind.Identifier,
      text: configManager.tags,
    },
  },
  // tw(...)
  {
    kind: SyntaxKind.CallExpression,
    // https://github.com/microsoft/typescript-template-language-service-decorator/blob/main/src/nodes.ts#L62
    // TODO styled.button, styled()
    expression: {
      kind: SyntaxKind.Identifier,
      text: configManager.tags,
    },
  },
  // JsxAttribute -> className=""
  {
    kind: SyntaxKind.JsxAttribute,
    name: {
      kind: SyntaxKind.Identifier,
      text: configManager.attributes,
    },
  },
  // { '@apply': `...` }
  {
    // Do not match the @apply property itself
    text: (value: string) => value !== '@apply',
    parent: {
      kind: SyntaxKind.PropertyAssignment,
      name: {
        kind: SyntaxKind.StringLiteral,
        text: '@apply',
      },
    },
  },
  // style({ base: '' })
  {
    kind: SyntaxKind.PropertyAssignment,
    name: {
      kind: [SyntaxKind.Identifier, SyntaxKind.StringLiteral],
      text: 'base',
    },
    // Do not match CSS objects: `base: { color: 'blue' }`
    initializer: (node: ts.Node) => node.kind !== SyntaxKind.ObjectLiteralExpression,
    // https://github.com/microsoft/typescript-template-language-service-decorator/blob/main/src/nodes.ts#L62
    // TODO styled.button, styled()
    parent: {
      kind: SyntaxKind.ObjectLiteralExpression,
      parent: {
        kind: SyntaxKind.CallExpression,
        expression: {
          kind: SyntaxKind.Identifier,
          text: configManager.styles,
        },
      },
    },
  },
  // style({ matches: [{ use: '' }] })
  {
    kind: SyntaxKind.PropertyAssignment,
    name: {
      kind: [SyntaxKind.Identifier, SyntaxKind.StringLiteral],
      text: 'use',
    },
    // Do not match CSS objects: `use: { color: 'blue' }`
    initializer: (node: ts.Node) => node.kind !== SyntaxKind.ObjectLiteralExpression,
    parent: {
      kind: SyntaxKind.ObjectLiteralExpression,
      parent: {
        kind: SyntaxKind.ArrayLiteralExpression,
        parent: {
          kind: SyntaxKind.PropertyAssignment,
          name: {
            kind: [SyntaxKind.Identifier, SyntaxKind.StringLiteral],
            text: 'matches',
          },
          // https://github.com/microsoft/typescript-template-language-service-decorator/blob/main/src/nodes.ts#L62
          // TODO styled.button, styled()
          parent: {
            kind: SyntaxKind.ObjectLiteralExpression,
            parent: {
              kind: SyntaxKind.CallExpression,
              expression: {
                kind: SyntaxKind.Identifier,
                text: configManager.styles,
              },
            },
          },
        },
      },
    },
  },
  // style({ variants: { [...]: { [...]: '...' }} })
  {
    kind: SyntaxKind.PropertyAssignment,
    // Do not match CSS objects
    initializer: (node: ts.Node) => node.kind !== SyntaxKind.ObjectLiteralExpression,
    parent: {
      kind: SyntaxKind.ObjectLiteralExpression,
      parent: {
        kind: SyntaxKind.PropertyAssignment,
        parent: {
          kind: SyntaxKind.ObjectLiteralExpression,
          parent: {
            kind: SyntaxKind.PropertyAssignment,
            name: {
              kind: [SyntaxKind.Identifier, SyntaxKind.StringLiteral],
              text: 'variants',
            },
            // https://github.com/microsoft/typescript-template-language-service-decorator/blob/main/src/nodes.ts#L62
            // TODO styled.button, styled()
            parent: {
              kind: SyntaxKind.ObjectLiteralExpression,
              parent: {
                kind: SyntaxKind.CallExpression,
                expression: {
                  kind: SyntaxKind.Identifier,
                  text: configManager.styles,
                },
              },
            },
          },
        },
      },
    },
  },
  // Debug helper
  // (value: ts.Node): boolean => {
  //   if (value?.kind == SyntaxKind.JsxAttribute) {
  //     console.log()
  //     console.log(value.kind, value.getText())
  //     console.log(Object.keys(value))
  //     console.log((value as any).name.kind, (value as any).name.text)
  //     // console.log((value as any).name?.kind)

  //     // console.log(value.parent.kind, value.getText())
  //     console.log()
  //   }
  //   return false
  // },
];
