import * as P from '@native-twin/arc-parser';
import type { ArbitrarySegmentToken, SegmentToken } from './tailwind.types.js';

/**
 * @description Parse the `-` symbol at starts of any rule that can be negative
 * @category `Tailwind Parsers`
 * */
export const maybeNegativeParser = P.maybe(P.char('-')).map((x) => !!x);

export const twClassNameIdent = /^[a-z0-9A-Z-.]+/;
export const twArbitraryIdent = /^[a-z0-9A-Z-.#]+/;
export const twSegmentParser = P.regex(twClassNameIdent).map(
  (x): SegmentToken => ({
    type: 'segment',
    value: x,
  }),
);

const betweenSquareBrackets = P.between(P.char('['))(P.char(']'));
export const twArbitraryParser = betweenSquareBrackets(P.regex(twArbitraryIdent)).map(
  (x): ArbitrarySegmentToken => ({
    type: 'arbitrary',
    value: x,
  }),
);
