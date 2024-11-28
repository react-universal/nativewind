import { type Rule, matchThemeValue } from '@native-twin/core';
import type { TailwindPresetTheme } from '../types/theme.types.js';

export const sizeRules: Rule<TailwindPresetTheme>[] = [
  matchThemeValue('aspect-', 'aspectRatio', 'aspectRatio'),
  matchThemeValue('w-', 'width', 'width'),
  matchThemeValue('h-', 'height', 'height'),
  matchThemeValue('max-w-', 'maxWidth', 'maxWidth'),
  matchThemeValue('max-h-', 'maxHeight', 'maxHeight'),
  matchThemeValue('min-w-', 'minWidth', 'minWidth'),
  matchThemeValue('min-h-', 'minHeight', 'minHeight'),
  matchThemeValue('resize-', 'resizeMode', 'resizeMode'),
];
