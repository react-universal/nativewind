import { matchThemeValue } from '@native-twin/core';
import type { Rule } from '@native-twin/core';
import type { TailwindPresetTheme } from '../types/theme.types.js';

export const opacityRules: Rule<TailwindPresetTheme>[] = [
  matchThemeValue('opacity-', 'opacity', 'opacity'),
];
