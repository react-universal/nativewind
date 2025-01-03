import * as P from '@native-twin/arc-parser';
import type { CssParserData } from './css-parser.types.js';
import {
  ParseCssDeclarationLine,
  parseDeclarationProperty,
} from './declarations.parser.js';
import { ParseCssDimensions } from './dimensions.parser.js';
import { ParseSelectorStrict } from './selector.parser.js';

export const GetAtRuleConditionToken = P.sequenceOf([
  parseDeclarationProperty,
  ParseCssDimensions,
]);
export const SkipRules = P.sequenceOf([P.skip(P.everyCharUntil('}')), P.char('}')]);

export const ParseCssRuleBlock = P.coroutine((run) => {
  const selector = run(ParseSelectorStrict);
  const platformSelector = selector.value.pseudoSelectors.find(
    (item) => item === 'ios' || item === 'android' || item === 'web',
  );
  const data = run(P.getData);
  if (platformSelector) {
    if (!selector.value.pseudoSelectors.some((item) => item === data.context.platform)) {
      run(SkipRules);
      return {
        selector,
        declarations: {},
      };
    }
  }
  const cache = data.cache.get(selector.value.selectorName);
  if (cache) {
    run(SkipRules);
    return {
      selector,
      declarations: cache,
    };
  }
  const declarations = run(P.betweenBrackets(ParseCssDeclarationLine));
  data.cache.set(selector.value.selectorName, declarations);
  return {
    selector,
    declarations,
  };
});

export const ParseCssAtRule = P.coroutine((run) => {
  const context = run(P.getData);
  run(P.literal('@media'));
  run(P.whitespace);
  const mediaRuleConstrains = run(P.betweenParens(GetAtRuleConditionToken));
  if (
    evaluateMediaQueryConstrains(
      { property: mediaRuleConstrains[0], value: mediaRuleConstrains[1] },
      context,
    )
  ) {
    const rule = run(P.betweenBrackets(ParseCssRuleBlock));
    return rule;
  }
  return null;
});

export const evaluateMediaQueryConstrains = (
  node: {
    value: number;
    property: string;
  },
  data: CssParserData,
) => {
  if (typeof node.value === 'number') {
    const value = node.value;
    const valueNumber = typeof value === 'number' ? value : Number.parseFloat(value);
    if (node.property === 'width') {
      return data.context.deviceWidth === valueNumber;
    }

    if (node.property === 'height') {
      return data.context.deviceHeight === valueNumber;
    }

    if (node.property === 'min-width') {
      return data.context.deviceWidth >= valueNumber;
    }

    if (node.property === 'max-width') {
      return data.context.deviceWidth <= valueNumber;
    }

    if (node.property === 'min-height') {
      return data.context.deviceHeight >= valueNumber;
    }

    if (node.property === 'max-height') {
      return data.context.deviceHeight <= valueNumber;
    }
  }
  return true;
};
