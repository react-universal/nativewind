import { matchThemeValue } from '@native-twin/core';
import type { Rule } from '@native-twin/core';
import { DEFAULT_META } from '../constants.js';
import type { TailwindPresetTheme } from '../types/theme.types.js';

export const transitionRules: Rule<TailwindPresetTheme>[] = [
  matchThemeValue('transition-', 'transition', 'transition', {
    ...DEFAULT_META,
    support: ['web'],
  }),
];

export const durationRules: Rule<TailwindPresetTheme>[] = [
  matchThemeValue('duration-', 'duration', 'transitionDuration', {
    ...DEFAULT_META,
  }),
];
