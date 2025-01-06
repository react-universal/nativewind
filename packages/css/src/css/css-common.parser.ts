import * as P from '@native-twin/arc-parser';
import type { CSSUnit, ParserToken } from './css.types.js';
import { cssUnitToken, floatToken, numericToken } from './tokens.js';

export const parseIntegerToken = P.digits.map(numericToken);
export const parseFloatToken = P.float.map(floatToken);

const plusOperator = P.char('+');
const minusOperator = P.char('-');
const multiplyOperator = P.char('*');
const divisionOperator = P.char('/');

export const parseMathOperatorSymbol = P.choice([
  plusOperator,
  minusOperator,
  multiplyOperator,
  divisionOperator,
]);

export const cssValueUnitParser = P.choice([
  P.literal('px'),
  P.literal('%'),
  P.literal('em'),
  P.literal('rem'),
  P.literal('deg'),
  P.literal('vh'),
  P.literal('vw'),
  P.literal('rad'),
  P.literal('turn'),
  P.literal('pc'),
  P.literal('cn'),
  P.literal('ex'),
  P.literal('in'),
  P.literal('pt'),
  P.literal('cm'),
  P.literal('mm'),
  P.literal('Q'),
]).map((x): ParserToken<'UNIT', CSSUnit> => cssUnitToken(x));

export const dimensionUnitParser = P.sequenceOf([parseFloatToken]);

export const declarationValueWithUnitParser = P.sequenceOf([
  P.float,
  P.maybe(cssValueUnitParser),
]);

const regexIdent = /^[_a-z0-9A-Z-]+/;
export const ident: P.Parser<string> = P.regex(regexIdent);
