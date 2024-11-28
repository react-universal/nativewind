import { createPercentRatios } from '@native-twin/helpers';
import type { TailwindPresetTheme } from '../types/theme.types.js';
import { spacing } from './mixed.js';

export const baseSize = {
  ...spacing,
  xs: '20rem',
  sm: '24rem',
  md: '28rem',
  lg: '32rem',
  xl: '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
  '6xl': '72rem',
  '7xl': '80rem',
  prose: '65ch',
  full: '100%',
  ...createPercentRatios(2, 6),
  ...createPercentRatios(12, 12),
};

export const width = {
  auto: 'auto',
  ...baseSize,
  screen: '100vw',
} satisfies TailwindPresetTheme['width'];

export const maxWidth = {
  ...baseSize,
  none: 'none',
  screen: '100vw',
} satisfies TailwindPresetTheme['maxWidth'];

export const height = {
  ...baseSize,
  auto: 'auto',
  screen: '100vh',
} satisfies TailwindPresetTheme['height'];

export const maxHeight = {
  ...baseSize,
  none: 'none',
  screen: '100vh',
} satisfies TailwindPresetTheme['maxHeight'];

export const containers = Object.fromEntries(
  Object.entries(baseSize).map(([k, v]) => [k, `(min-width: ${v})`]),
) satisfies TailwindPresetTheme['containers'];

export const aspectRatio = {
  square: '1/1',
  video: '16/9',
} satisfies TailwindPresetTheme['aspectRatio'];
