import {
  createExponentialUnits,
  createLinearUnits,
  createPercentRatios,
} from '@native-twin/helpers';
import type { TailwindPresetTheme } from '../types/theme.types.js';
import { spacing } from './mixed.js';

export const translate = {
  ...spacing,
  .../* #__PURE__ */ createPercentRatios(2, 4),
  full: '100%',
} satisfies TailwindPresetTheme['translate'];

export const rotate = {
  .../* #__PURE__ */ createExponentialUnits(2, 'deg'),
  // 0: '0deg',
  // 1: '1deg',
  // 2: '2deg',
  .../* #__PURE__ */ createExponentialUnits(12, 'deg', 3),
  // 3: '3deg',
  // 6: '6deg',
  // 12: '12deg',
  .../* #__PURE__ */ createExponentialUnits(180, 'deg', 45),
  // 45: '45deg',
  // 90: '90deg',
  // 180: '180deg',
} satisfies TailwindPresetTheme['rotate'];

export const skew = {
  .../* #__PURE__ */ createExponentialUnits(2, 'deg'),
  // 0: '0deg',
  // 1: '1deg',
  // 2: '2deg',
  .../* #__PURE__ */ createExponentialUnits(12, 'deg', 3),
  // 3: '3deg',
  // 6: '6deg',
  // 12: '12deg',
} satisfies TailwindPresetTheme['skew'];

export const scale = {
  .../* #__PURE__ */ createLinearUnits(150, '', 100, 0, 50),
  // 0: '0',
  // 50: '.5',
  // 150: '1.5',
  .../* #__PURE__ */ createLinearUnits(110, '', 100, 90, 5),
  // 90: '.9',
  // 95: '.95',
  // 100: '1',
  // 105: '1.05',
  // 110: '1.1',
  75: '0.75',
  125: '1.25',
} satisfies TailwindPresetTheme['scale'];
