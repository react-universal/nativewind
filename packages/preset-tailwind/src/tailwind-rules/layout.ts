import { matchCssObject, matchThemeValue } from '@native-twin/core';
import type { Rule } from '@native-twin/core';
import { parsedRuleToClassName } from '@native-twin/css';
import type { TailwindPresetTheme } from '../types/theme.types.js';

export const layoutThemeRules: Rule<TailwindPresetTheme>[] = [
  matchCssObject('hidden', (match, ctx, rule) => ({
    className: parsedRuleToClassName(rule),
    declarations: [
      {
        prop: 'display',
        value: 'none',
      },
    ],
    conditions: rule.v,
    important: rule.i,
    precedence: rule.p,
    selectors: [],
    animations: [],
    preflight: false,
  })),
  matchThemeValue('overflow-', 'overflow', 'overflow'),
  matchThemeValue('object-', 'objectFit', 'objectFit'),
];
