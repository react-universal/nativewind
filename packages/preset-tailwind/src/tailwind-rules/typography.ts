import { matchThemeColor, matchThemeValue } from '@native-twin/core';
import type { Rule } from '@native-twin/core';
import type { TailwindPresetTheme } from '../types/theme.types.js';

export const fontThemeRules: Rule<TailwindPresetTheme>[] = [
  matchThemeColor('text-', 'color'),
  matchThemeValue('text-', 'fontSize', 'fontSize', {
    canBeNegative: false,
    feature: 'default',
    prefix: undefined,
    styleProperty: 'fontSize',
    suffix: undefined,
    support: ['native', 'web'],
  }),
  matchThemeValue('font-', 'fontWeight', 'fontWeight'),
  matchThemeValue('font-', 'fontFamily', 'fontFamily'),
  matchThemeValue('leading-', 'lineHeight', 'lineHeight'),
  matchThemeColor('decoration-', 'textDecorationColor'),
  matchThemeValue('decoration-', 'textDecorationStyle', 'textDecorationStyle'),
  matchThemeValue('decoration-', 'textDecorationLine', 'textDecorationLine'),
  matchThemeValue('capitalize', 'textTransform', 'textTransform'),
  matchThemeValue('uppercase', 'textTransform', 'textTransform'),
  matchThemeValue('lowercase', 'textTransform', 'textTransform'),
  matchThemeValue('normal', 'fontStyle', 'fontStyle'),
  matchThemeValue('italic', 'fontStyle', 'fontStyle'),
];
