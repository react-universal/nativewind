import {
  Layer,
  moveToLayer,
  parsedRuleToClassName,
  type SheetEntry,
  type TWParsedRule,
} from '@native-twin/css';
import type { ThemeContext } from '../types/config.types.js';
import { convert } from './convertRule.js';

/**
 * Converts a parsed rule to a sheet entry based on the given context.
 *
 * @param {ParsedRule} rule - The parsed rule to convert.
 * @param {ThemeContext} context - The context in which the conversion is happening.
 * @return {SheetEntry} The converted sheet entry.
 */
export function parsedRuleToEntry(rule: TWParsedRule, context: ThemeContext): SheetEntry {
  if (rule.n == 'group') {
    return {
      className: 'group',
      declarations: [],
      selectors: [],
      precedence: Layer.u,
      important: rule.i,
      animations: [],
      preflight: false,
    };
  }
  if (context.mode === 'web') {
    if (
      (rule.v.includes('ios') ||
        rule.v.includes('android') ||
        rule.v.includes('native')) &&
      !rule.v.includes('web')
    ) {
      return {
        className: parsedRuleToClassName(rule),
        declarations: [],
        selectors: [],
        precedence: Layer.u,
        important: rule.i,
        animations: [],
        preflight: false,
      };
    }
  }
  const result = context.r(rule);
  if (!result) {
    // propagate className as is
    return {
      className: parsedRuleToClassName(rule),
      declarations: [],
      selectors: [],
      precedence: Layer.u,
      important: rule.i,
      animations: [],
      preflight: false,
    };
  }
  // const newRule = context.mode === 'web' ? convert(rule, context, Layer.u) : rule;
  const newRule = convert(rule, context, Layer.u);
  result.selectors = newRule.v;
  result.precedence = moveToLayer(Layer.u, newRule.p);
  return result;
}
