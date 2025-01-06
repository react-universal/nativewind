import {
  type TWParsedRule,
  atRulePrecedence,
  mql,
  parsedRuleToClassName,
  pseudoPrecedence,
} from '@native-twin/css';
import { asArray } from '@native-twin/helpers';
import type { ThemeContext } from '../types/config.types.js';
import type { __Theme__ } from '../types/theme.types.js';

/**
 * Converts provided parsed CSS rule to a specific format and applies necessary conditions.
 *
 * @param {TWParsedRule} rule - Parsed CSS rule. It includes name, important, variants, and modifier of the rule.
 * @param {ThemeContext<Theme>} context - The current theme context.
 * @param {number} precedence - Numeric value indicating the order of applying the rule.
 * @param {string[]} [conditions] - Array of conditions.
 *
 * @returns {TWParsedRule} - The converted parsed rule with applied conditions.
 *
 * @example
 * const rule = {
 *  n: 'name',
 *  i: 'important',
 *  v: ['variant1', 'variant2'],
 *  m: 'modifier',
 * };
 * const context = new ThemeContext();
 * const precedence = 1;
 * const conditions = ['condition1', 'condition2'];
 * convert(rule, context, precedence, conditions);
 *
 * @template Theme - The theme type. Default is __Theme__.
 */
export function convert<Theme extends __Theme__ = __Theme__>(
  { n: name, i: important, v: variants = [], m: modifier }: TWParsedRule,
  context: ThemeContext<Theme>,
  precedence: number,
  conditions?: string[],
): TWParsedRule {
  if (name) {
    name = parsedRuleToClassName({
      n: name,
      i: important,
      v: variants,
      m: modifier,
      p: 0,
    });
  }

  conditions = [...asArray(conditions)];

  for (const variant of variants) {
    const screen = context.theme('screens', variant);
    if (context.mode === 'native') {
      if (screen) {
        conditions.push(screen);
      } else {
        conditions.push(variant);
      }
      // continue;
    }
    for (const condition of asArray((screen && mql(screen)) || context.v(variant))) {
      if (!condition) continue;
      conditions.push(condition);

      precedence |= screen
        ? (1 << 26) /* Shifts.screens */ | atRulePrecedence(condition)
        : variant === 'dark'
          ? 1 << 30 /* Shifts.darkMode */
          : condition[0] === '@'
            ? atRulePrecedence(condition)
            : pseudoPrecedence(condition);
    }
  }

  return { n: name, p: precedence, i: important, m: modifier, v: conditions };
}
