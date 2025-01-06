import { matchThemeValue } from '@native-twin/core';
import type { Rule } from '@native-twin/core';
import { DEFAULT_META } from '../constants.js';
import type { TailwindPresetTheme } from '../types/theme.types.js';

export const translateRules: Rule<TailwindPresetTheme>[] = [
  matchThemeValue('translate-', 'translate', 'transform', {
    ...DEFAULT_META,
    feature: 'transform-2d',
    prefix: 'translate',
  }),
  matchThemeValue('rotate-', 'rotate', 'transform', {
    ...DEFAULT_META,
    feature: 'transform-2d',
    prefix: 'rotate',
  }),
  matchThemeValue('skew-', 'skew', 'transform', {
    ...DEFAULT_META,
    feature: 'transform-2d',
    prefix: 'skew',
  }),
  matchThemeValue('scale-', 'scale', 'transform', {
    ...DEFAULT_META,
    feature: 'transform-2d',
    prefix: 'scale',
  }),
];
