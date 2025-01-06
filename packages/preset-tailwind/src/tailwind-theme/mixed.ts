import { createExponentialUnits, createLinearUnits } from '@native-twin/helpers';
import type { TailwindPresetTheme } from '../types/theme.types.js';

// keep in ASC order: container.ts and breakpoints.ts need that order
export const screens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} satisfies TailwindPresetTheme['screens'];

export const opacity = {
  .../* #__PURE__ */ createLinearUnits(100, '', 100, 0, 10),
  5: '0.05',
  25: '0.25',
  75: '0.75',
  95: '0.95',
} satisfies TailwindPresetTheme['opacity'];

export const verticalBreakpoints = {
  ...screens,
} satisfies TailwindPresetTheme['verticalBreakpoints'];

export const lineWidth = {
  DEFAULT: '1px',
  none: '0',
  .../* #__PURE__ */ createLinearUnits(10, 'rem', 4, 3),
} satisfies TailwindPresetTheme['lineWidth'];

export const spacing = {
  DEFAULT: '1rem',
  none: '0',
  xs: '0.75rem',
  sm: '0.875rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
  '7xl': '4.5rem',
  '8xl': '6rem',
  '9xl': '8rem',

  // CUSTOM
  px: '1px',
  0: '0px',
  .../* #__PURE__ */ createLinearUnits(4, 'rem', 4, 0.5, 0.5),
  .../* #__PURE__ */ createLinearUnits(12, 'rem', 4, 5),
  14: '3.5rem',
  .../* #__PURE__ */ createLinearUnits(64, 'rem', 4, 16, 4),
  72: '18rem',
  80: '20rem',
  96: '24rem',
} satisfies TailwindPresetTheme['spacing'];

export const duration = {
  DEFAULT: '150ms',
  none: '0s',
  75: '75ms',
  100: '100ms',
  150: '150ms',
  200: '200ms',
  300: '300ms',
  500: '500ms',
  700: '700ms',
  1000: '1000ms',
} satisfies TailwindPresetTheme['duration'];

export const borderRadius = {
  DEFAULT: '0.25rem',
  none: '0',
  sm: '0.125rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  '1/2': '50%',
  full: '9999px',
} satisfies TailwindPresetTheme['borderRadius'];

export const borderStyle = {
  solid: 'solid',
  dotted: 'dotted',
  dashed: 'dashed',
} satisfies TailwindPresetTheme['borderStyle'];

export const backfaceVisibility = {
  visible: 'visible',
  hidden: 'hidden',
} satisfies TailwindPresetTheme['backfaceVisibility'];

export const boxShadow = {
  DEFAULT: {
    shadowOffset: { width: 0, height: 1 },
    shadowColor: 'rgb(0,0,0)',
    shadowRadius: 3,
    shadowOpacity: 0.3,
    elevation: 1,
  },
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    shadowOpacity: 0.3,
    shadowColor: 'rgb(0,0,0)',
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowColor: 'rgb(0,0,0)',
    shadowRadius: 3,
    shadowOpacity: 0.3,
    elevation: 1,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowColor: 'rgb(0,0,0)',
    shadowRadius: 6,
    shadowOpacity: 0.3,
    elevation: 3,
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowColor: 'rgb(0,0,0)',
    shadowRadius: 8,
    shadowOpacity: 0.3,
    elevation: 6,
  },
  xl: {
    shadowOffset: { width: 0, height: 20 },
    shadowColor: 'rgb(0,0,0)',
    shadowRadius: 25,
    shadowOpacity: 0.3,
    elevation: 9,
  },
} satisfies TailwindPresetTheme['boxShadow'];

export const easing = {
  DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
} satisfies TailwindPresetTheme['easing'];

export const ringWidth = {
  DEFAULT: '1px',
  none: '0',
} satisfies TailwindPresetTheme['ringWidth'];

export const borderWidth = {
  DEFAULT: '1px',
  .../* #__PURE__ */ createExponentialUnits(8, 'px'),
} satisfies TailwindPresetTheme['borderWidth'];

export const zIndex = {
  .../* #__PURE__ */ createLinearUnits(50, '', 1, 0, 10),
  auto: 'auto',
} satisfies TailwindPresetTheme['zIndex'];

export const overflow = {
  visible: 'visible',
  hidden: 'hidden',
  none: 'scroll',
} satisfies TailwindPresetTheme['overflow'];

export const objectFit = {
  cover: 'cover',
  contain: 'contain',
  fill: 'fill',
  'scale-down': 'scale-down',
} satisfies TailwindPresetTheme['objectFit'];

export const position = {
  absolute: 'absolute',
  relative: 'relative',
} satisfies TailwindPresetTheme['position'];
