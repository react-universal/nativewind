import { matchThemeValue } from '@native-twin/core';
import type { Rule } from '@native-twin/core';
import type { TailwindPresetTheme } from '../types/theme.types.js';

export const boxShadowRules: Rule<TailwindPresetTheme>[] = [
  matchThemeValue('shadow-', 'boxShadow', 'shadowRadius'),
];
