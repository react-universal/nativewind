import { createLinearUnits } from '@native-twin/helpers';
import type { TailwindPresetTheme } from '../types/theme.types.js';

export const fontFamily = {
  sans: [
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    '"Noto Sans"',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
    '"Noto Color Emoji"',
  ].join(','),
  serif: ['ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'].join(
    ',',
  ),
  mono: [
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    '"Liberation Mono"',
    '"Courier New"',
    'monospace',
  ].join(','),
} satisfies TailwindPresetTheme['fontFamily'];

export const fontSize: TailwindPresetTheme['fontSize'] = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
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
} satisfies TailwindPresetTheme['fontSize'];

export const textIndent: TailwindPresetTheme['textIndent'] = {
  DEFAULT: '1.5rem',
  xs: '0.5rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '2.5rem',
  '2xl': '3rem',
  '3xl': '4rem',
} satisfies TailwindPresetTheme['textIndent'];

export const textStrokeWidth: TailwindPresetTheme['textStrokeWidth'] = {
  DEFAULT: '1.5rem',
  none: '0',
  sm: 'thin',
  md: 'medium',
  lg: 'thick',
} satisfies TailwindPresetTheme['textStrokeWidth'];

export const textShadow = {
  DEFAULT: ['0 0 1px rgba(0,0,0,0.2)', '0 0 1px rgba(1,0,5,0.1)'],
  none: '0 0 rgba(0,0,0,0)',
  sm: '1px 1px 3px rgba(36,37,47,0.25)',
  md: ['0 1px 2px rgba(30,29,39,0.19)', '1px 2px 4px rgba(54,64,147,0.18)'],
  lg: ['3px 3px 6px rgba(0,0,0,0.26)', '0 0 5px rgba(15,3,86,0.22)'],
  xl: ['1px 1px 3px rgba(0,0,0,0.29)', '2px 4px 7px rgba(73,64,125,0.35)'],
} satisfies TailwindPresetTheme['textShadow'];

export const lineHeight = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
  .../* #__PURE__ */ createLinearUnits(10, 'rem', 4, 3),
} satisfies TailwindPresetTheme['lineHeight'];

export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} satisfies TailwindPresetTheme['letterSpacing'];

export const fontWeight = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
  // int[0, 900] -> int
} satisfies TailwindPresetTheme['fontWeight'];

export const wordSpacing = letterSpacing satisfies TailwindPresetTheme['letterSpacing'];

export const textDecorationStyle = {
  solid: 'solid',
  double: 'double',
  dotted: 'dotted',
} satisfies TailwindPresetTheme['textDecorationStyle'];

export const textDecorationLine = {
  thought: 'line-through',
  'under-through': 'underline line-through',
  none: 'none',
  underline: 'underline',
} satisfies TailwindPresetTheme['textDecorationLine'];

export const textTransform = {
  capitalize: 'capitalize',
  uppercase: 'uppercase',
  lowercase: 'lowercase',
} satisfies TailwindPresetTheme['textTransform'];

export const fontStyle = {
  normal: 'normal',
  italic: 'italic',
} satisfies TailwindPresetTheme['fontStyle'];
