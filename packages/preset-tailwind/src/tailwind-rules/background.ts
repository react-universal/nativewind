import { matchThemeColor } from '@native-twin/core';
import type { Rule } from '@native-twin/core';
import type { TailwindPresetTheme } from '../types/theme.types.js';

export const backgroundRules: Rule<TailwindPresetTheme>[] = [
  matchThemeColor('bg-', 'backgroundColor'),
];
