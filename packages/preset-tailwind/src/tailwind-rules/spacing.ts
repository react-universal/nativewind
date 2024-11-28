import { matchThemeValue } from '@native-twin/core';
import type { Rule } from '@native-twin/core';
import type { TailwindPresetTheme } from '../types/theme.types.js';
import { DEFAULT_META } from '../constants.js';

export const spacingRules: Rule<TailwindPresetTheme>[] = [
  matchThemeValue('p', 'spacing', 'padding', {
    ...DEFAULT_META,
    canBeNegative: true,
    feature: 'edges',
    prefix: 'padding',
  }),
  matchThemeValue('m', 'spacing', 'margin', {
    ...DEFAULT_META,
    canBeNegative: true,
    feature: 'edges',
    prefix: 'margin',
  }),
  matchThemeValue('gap-', 'spacing', 'gap', {
    ...DEFAULT_META,
    feature: 'gap',
    prefix: 'gap',
  }),
];
