import * as P from '@native-twin/arc-parser';
import type { AnyStyle } from '../../react-native/rn.types.js';
import type { CssParserData } from './css-parser.types.js';
import { ParseCssRules } from './rules.parser.js';

export const CreateCssResolver = () => {
  const cache = new Map<string, AnyStyle>();

  return function interpreter(target: string[], context: CssParserData['context']) {
    const fullCss = target.join('');
    const parseFull = parseCssTarget(fullCss, context);
    return parseFull;
  };

  function parseCssTarget(target: string, context: CssParserData['context']) {
    const parsed = P.withData(ParseCssRules)({
      cache: {
        get: getCacheForSelector,
        set: setCacheForSelector,
      },
      context,
      styles: {},
    }).run(target);

    return parsed.data.styles;
  }

  function getCacheForSelector(selector: string) {
    if (cache.has(selector)) {
      return cache.get(selector)!;
    }
    return null;
  }

  function setCacheForSelector(selector: string, style: AnyStyle) {
    cache.set(selector, style);
  }
};

export const CssResolver = CreateCssResolver();
