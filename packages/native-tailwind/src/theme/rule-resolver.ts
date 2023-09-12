import type { RuleMeta, RuleResolver } from '../types/config.types';
import type { CSSProperties } from '../types/css.types';
import type { __Theme__ } from '../types/theme.types';
import { toColorValue } from './theme.utils';

export function resolveColorValue(
  pattern: string,
  property: keyof CSSProperties,
  _meta: RuleMeta = {
    canBeNegative: false,
    feature: 'default',
    baseProperty: undefined,
  },
): [string, keyof CSSProperties, RuleResolver<__Theme__>] {
  return [
    pattern,
    property,
    (match, context, rule) => {
      if (match.$$ in context.colors) {
        return {
          [property]: toColorValue(context.colors[match.$$]!, {
            opacityValue: rule.m?.value ?? '1',
          }),
        };
      }
    },
  ];
}

export function resolveThemeValue<Theme extends __Theme__ = __Theme__>(
  pattern: string,
  themeSection: keyof Theme | (string & {}),
  property: keyof CSSProperties | undefined,
  meta: RuleMeta = {
    canBeNegative: false,
    feature: 'default',
    baseProperty: undefined,
    customValues: undefined,
  },
): [string, keyof Theme | (string & {}), RuleResolver<Theme>] {
  return [
    pattern,
    themeSection,
    (match, context) => {
      if (meta.customValues) {
        const value = meta.customValues[match.$$];
        if (!value) return;
        return {
          [property ?? themeSection]: maybeNegative(match[0], value),
        };
      }
      const themeSectionValue = context.theme(themeSection, match.$$);
      if (themeSectionValue) {
        return {
          [property ?? themeSection]: maybeNegative(match[0], themeSectionValue),
        };
      }
    },
  ];
}

function maybeNegative(base: string, value: string) {
  if (base.startsWith('-')) {
    return `-${value}`;
  }
  return value;
}
