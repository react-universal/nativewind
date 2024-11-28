import { asRegExp } from '@native-twin/helpers';
import type { ReMatchResult, ThemeContext, Variant } from '../types/config.types.js';
import type { __Theme__ } from '../types/theme.types.js';

export const createVariantResolver = <Theme extends __Theme__ = __Theme__>(
  variant: Variant<Theme>,
) => {
  const [rawPattern, resolver] = variant;
  const condition = asRegExp(rawPattern);
  return (token: string, context: ThemeContext<Theme>) => {
    const match = condition.exec(token) as ReMatchResult;
    if (!match) return null;
    match.$$ = token.slice(match[0].length);
    if (typeof resolver == 'string') {
      return resolver;
    }
    return resolver(match, context);
  };
};
