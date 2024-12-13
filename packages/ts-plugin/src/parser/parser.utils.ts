import { type ThemeContext, convert } from '@native-twin/core';
import {
  type ArbitraryToken,
  type ClassNameToken,
  Layer as CssLayer,
  type VariantClassToken,
  moveToLayer,
  parsedRuleToClassName,
} from '@native-twin/css';
import type {
  LocatedGroupTokenWithText,
  LocatedParsedRule,
  LocatedParser,
  LocatedSheetEntry,
  TemplateTokenWithText,
} from '../template/template.types';

export const classNameTokenToRule = (
  token: LocatedParser<ClassNameToken>,
): LocatedParsedRule => ({
  n: token.value.n,
  v: [],
  i: token.value.i,
  m: token.value.m,
  p: 0,
  loc: { start: token.start, end: token.end },
  type: token.type,
});

export const arbitraryTokenToRule = (
  token: LocatedParser<ArbitraryToken>,
): LocatedParsedRule => ({
  n: token.value,
  v: [],
  i: false,
  m: null,
  p: 0,
  loc: { start: token.start, end: token.end },
  type: token.type,
});

const groupToRules = (nextToken: LocatedGroupTokenWithText) => {
  const results: LocatedParsedRule[] = [];
  const baseValue = nextToken.value.base;

  if (nextToken.value.content.length === 0) {
    if (baseValue.type === 'VARIANT') {
      for (const value of baseValue.value) {
        results.push({
          i: baseValue.value.some((x) => x.i),
          loc: {
            end: baseValue.end,
            start: baseValue.start,
          },
          m: null,
          n: '',
          p: 0,
          type: baseValue.type,
          v: [value.n],
        });
      }
    }
  }
  const parts = anyTokenToRule(nextToken.value.content).map((x): LocatedParsedRule => {
    if (baseValue.type === 'CLASS_NAME') {
      return {
        ...x,
        i: baseValue.value.i,
        m: baseValue.value.m,
        n: `${baseValue.value.n}-${x.n}`,
        type: baseValue.type,
        loc: {
          end: baseValue.end,
          start: baseValue.start,
        },
      };
    }
    return {
      ...x,
      v: [...x.v, ...baseValue.value.map((y) => y.n)],
      i: x.i || baseValue.value.some((y) => y.i),
      type: baseValue.type,
      loc: {
        end: baseValue.end,
        start: baseValue.start,
      },
    };
  });
  return [...parts, ...results];
};

export const variantClassTokenToRule = (
  token: LocatedParser<VariantClassToken>,
): LocatedParsedRule => ({
  n: token.value[1].value.n,
  v: token.value[0].value.map((y) => y.n),
  i: token.value[1].value.i || token.value[0].value.some((y) => y.i),
  m: token.value[1].value.m,
  p: 0,
  loc: { start: token.start, end: token.end },
  type: token.type,
});
export const tokenToRule = (token: TemplateTokenWithText) => {
  if (token.type === 'ARBITRARY') {
    return arbitraryTokenToRule(token);
  }

  if (token.type === 'CLASS_NAME') {
    return classNameTokenToRule(token);
  }

  if (token.type === 'VARIANT_CLASS') {
    return variantClassTokenToRule(token);
  }

  if (token.type === 'GROUP') {
    return groupToRules(token);
  }

  return null;
};

export function anyTokenToRule(
  groupContent: TemplateTokenWithText[],
  results: LocatedParsedRule[] = [],
): LocatedParsedRule[] {
  const nextToken = groupContent.shift();
  if (!nextToken) return results;
  if (nextToken.type === 'ARBITRARY') {
    results.push(arbitraryTokenToRule(nextToken));
  }
  if (nextToken.type === 'CLASS_NAME') {
    results.push(classNameTokenToRule(nextToken));
  }
  if (nextToken.type === 'VARIANT_CLASS') {
    results.push(variantClassTokenToRule(nextToken));
  }
  if (nextToken.type === 'GROUP') {
    const group = groupToRules(nextToken);
    results.push(...group);
  }
  return anyTokenToRule(groupContent, results);
}

export const tokensToRules = (tokens: TemplateTokenWithText[]) => {
  return anyTokenToRule(tokens);
};

/**
 * Converts a parsed rule to a sheet entry based on the given context.
 *
 * @param {ParsedRule} rule - The parsed rule to convert.
 * @param {ThemeContext} context - The context in which the conversion is happening.
 * @return {SheetEntry} The converted sheet entry.
 */
export function locatedParsedRuleLocatedSheetEntry(
  rule: LocatedParsedRule,
  context: ThemeContext,
): LocatedSheetEntry {
  if (rule.n === 'group') {
    return {
      className: 'group',
      declarations: [],
      selectors: [],
      preflight: false,
      precedence: CssLayer.u,
      important: rule.i,
      loc: rule.loc,
      animations: [],
    };
  }
  if (context.mode === 'web') {
    if (
      (rule.v.includes('ios') ||
        rule.v.includes('android') ||
        rule.v.includes('native')) &&
      !rule.v.includes('web')
    ) {
      return {
        className: parsedRuleToClassName(rule),
        declarations: [],
        selectors: [],
        preflight: false,
        precedence: CssLayer.u,
        important: rule.i,
        loc: rule.loc,
        animations: [],
      };
    }
  }
  const result = context.r(rule);
  if (!result) {
    // propagate className as is
    return {
      className: parsedRuleToClassName(rule),
      declarations: [],
      preflight: false,
      selectors: [],
      precedence: CssLayer.u,
      important: rule.i,
      loc: rule.loc,
      animations: [],
    };
  }
  const newRule = context.mode === 'web' ? convert(rule, context, CssLayer.u) : rule;
  result.selectors = newRule.v;
  result.precedence = moveToLayer(CssLayer.u, newRule.p);
  return { ...result, loc: rule.loc };
}
