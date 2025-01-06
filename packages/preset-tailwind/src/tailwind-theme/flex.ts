import { createPercentRatios } from '@native-twin/helpers';
import type { TailwindPresetTheme } from '../types/theme.types.js';
import { spacing } from './mixed.js';

export const flexGrow = {
  DEFAULT: '1',
  0: '0',
  1: '1',
} satisfies TailwindPresetTheme['flexGrow'];

export const flexBasis = {
  ...spacing,
  .../* #__PURE__ */ createPercentRatios(2, 6),
  .../* #__PURE__ */ createPercentRatios(12, 12),
  auto: 'auto',
  full: '100%',
} satisfies TailwindPresetTheme['flexBasis'];

export const flex = {
  1: '1 1 0%',
  auto: '1 1 auto',
  initial: '0 1 auto',
  none: 'none',
} satisfies TailwindPresetTheme['flex'];

export const flexDirection = {
  col: 'column',
  'col-reverse': 'column-reverse',
  row: 'row',
  'row-reverse': 'row-reverse',
} satisfies TailwindPresetTheme['flexDirection'];

export const flexWrap = {
  wrap: 'wrap',
  'wrap-reverse': 'wrap-reverse',
  nowrap: 'nowrap',
} satisfies TailwindPresetTheme['flexWrap'];

export const justifyContent = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
  stretch: 'space-stretch',
} satisfies TailwindPresetTheme['justifyContent'];

export const alignItems = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  auto: 'auto',
  stretch: 'stretch',
  baseline: 'baseline',
} satisfies TailwindPresetTheme['alignItems'];

export const alignContent = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  stretch: 'stretch',
  between: 'space-between',
  around: 'space-around',
} satisfies TailwindPresetTheme['alignContent'];
