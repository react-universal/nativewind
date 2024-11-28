import { matchThemeColor, matchThemeValue } from '@native-twin/core';
import type { Rule } from '@native-twin/core';
import type { TailwindPresetTheme } from '../types/theme.types.js';
import { DEFAULT_META } from '../constants.js';

export const borderRules: Rule<TailwindPresetTheme>[] = [
  matchThemeColor('border-', 'borderColor', {
    ...DEFAULT_META,
    feature: 'edges',
    prefix: 'border',
    suffix: 'Color',
  }),
  matchThemeValue('border-', 'borderStyle', 'borderStyle'),
  matchThemeValue('border-', 'borderWidth', 'borderWidth', {
    ...DEFAULT_META,
    feature: 'edges',
    prefix: 'border',
    suffix: 'Width',
  }),
  matchThemeValue('rounded-', 'borderRadius', 'borderRadius', {
    ...DEFAULT_META,
    feature: 'corners',
    prefix: 'border',
    suffix: 'Radius',
  }),
];
