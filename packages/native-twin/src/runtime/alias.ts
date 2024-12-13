import {
  type CSSValue,
  interpolate,
  parseTWTokens,
  parsedRuleSetToClassNames,
} from '@native-twin/css';

export type NestedFunction = (
  strings: TemplateStringsArray | CSSValue,
  ...interpolations: CSSValue[]
) => string;

export type Nested = NestedFunction & {
  [label: string]: NestedFunction;
};

/**
 * @group Class Name Generators
 */
export const apply = /* #__PURE__ */ alias('@');

/**
 * @group Class Name Generators
 */
export const shortcut = /* #__PURE__ */ alias('~');

function alias(marker: string): Nested {
  return new Proxy(
    function alias(
      strings: TemplateStringsArray | CSSValue,
      ...interpolations: CSSValue[]
    ): string {
      return alias$('', strings, interpolations);
    } as Nested,
    {
      get(target, name) {
        if (name in target) return target[name as string];

        return function namedAlias(
          strings: TemplateStringsArray | CSSValue,
          ...interpolations: CSSValue[]
        ): string {
          return alias$(name as string, strings, interpolations);
        };
      },
    },
  );

  function alias$(
    name: string,
    strings: TemplateStringsArray | CSSValue,
    interpolations: CSSValue[],
  ): string {
    return parsedRuleSetToClassNames(
      parseTWTokens(`${name + marker}(${interpolate(strings, interpolations)})`),
    );
  }
}
