import { matchCssObject } from '@native-twin/core';
import type { Rule } from '@native-twin/core';
import { parsedRuleToClassName } from '@native-twin/css';
import type { TailwindPresetTheme } from '../types/theme.types.js';

export const outlineRules: Rule<TailwindPresetTheme>[] = [
  // matchThemeValue('outline-width-', 'lineWidth', 'outlineWidth'),
  // matchThemeColor('outline-', 'outlineColor'),
  // matchThemeValue('outline-offset-', 'lineWidth', 'outlineOffset'),
  // matchThemeValue('outline-', '', 'outlineStyle', {
  //   customValues: Object.fromEntries(outlineStyles),
  // }),
  matchCssObject('outline-none', (match, ctx, rule) => {
    if (ctx.mode == 'native') {
      return null;
    }
    return {
      className: parsedRuleToClassName(rule),
      declarations: [
        {
          prop: 'outline',
          value: '2px solid transparent',
        },
        {
          prop: 'outlineOffset',
          value: '2px',
        },
      ],
      selectors: [],
      animations: [],
      conditions: rule.v,
      important: rule.i,
      precedence: rule.p,
      preflight: false,
    };
  }),
];

export const appearanceRules: Rule[] = [
  matchCssObject('appearance-none', (match, ctx, rule) => ({
    className: parsedRuleToClassName(rule),
    declarations: [
      {
        prop: 'appearance',
        value: 'none',
      },
    ],
    conditions: rule.v,
    selectors: [],
    important: rule.i,
    precedence: rule.p,
    animations: [],
    preflight: false,
  })),
];
