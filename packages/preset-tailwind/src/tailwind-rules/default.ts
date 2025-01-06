import type { Rule } from '@native-twin/core';
import type { TailwindPresetTheme } from '../types/theme.types.js';
import { textAlignsRules, verticalAlignsRules } from './align.js';
import { backgroundRules } from './background.js';
import { appearanceRules, outlineRules } from './behaviors.js';
import { borderRules } from './border.js';
import { flexRules } from './flex.js';
import { layoutThemeRules } from './layout.js';
import { opacityRules } from './opacity.js';
import { positionRules } from './position.js';
import { boxShadowRules } from './shadows.js';
import { sizeRules } from './size.js';
import { spacingRules } from './spacing.js';
import { translateRules } from './transform.js';
import { durationRules, transitionRules } from './transition.js';
import { fontThemeRules } from './typography.js';

export const themeRules: Rule<TailwindPresetTheme>[] = [
  backgroundRules,
  flexRules,

  spacingRules,
  sizeRules,
  fontThemeRules,
  positionRules,
  textAlignsRules,
  borderRules,
  layoutThemeRules,
  opacityRules,
  outlineRules,
  verticalAlignsRules,
  appearanceRules,
  boxShadowRules,
  transitionRules,
  durationRules,
  translateRules,
].flat(1) as Rule[];
