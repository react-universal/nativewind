import * as P from '@native-twin/arc-parser';
import { cssValueUnitParser, parseMathOperatorSymbol } from '../css-common.parser.js';

export const ParseCssDimensions = P.recursiveParser(() =>
  P.choice([P.whitespaceSurrounded(ParseDimensionWithUnits), ParseCssCalc]),
);

const ParseDimensionWithUnits = P.sequenceOf([
  P.float,
  P.maybe(cssValueUnitParser),
]).mapFromData((parserState) => {
  const { result, data } = parserState;
  const value = parseFloat(result[0]);
  switch (result[1]?.value) {
    case 'px':
      return value;
    case 'rem':
    case 'em':
      return value * data.context.rem;
    case '%':
      return `${value}%` as unknown as number;
    case 'vh':
      return data.context.deviceHeight! * (value / 100);
    case 'vw':
      return data.context.deviceWidth! * (value / 100);
    case 'turn':
      return `${360 * value}deg` as unknown as number;
    case 'deg':
      return `${value}deg` as unknown as number;
    case 'rad':
      return `${value}rad` as unknown as number;
    case 'in':
      return value * 96;
    case 'pc':
      return value * (96 / 6);
    case 'pt':
      return value * (96 / 72);
    case 'cm':
      return value * 97.8;
    case 'mm':
      return value * (97.8 / 10);
    case 'Q':
      return value * (97.8 / 40);
    default:
      return value;
  }
});

export const ParseCssMath = P.sequenceOf([
  ParseCssDimensions,
  parseMathOperatorSymbol,
  ParseCssDimensions,
]).map(([left, operator, right]) => {
  switch (operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return left / right;
    default:
      return left;
  }
});

const ParseCssCalc = P.sequenceOf([
  P.literal('calc'),
  P.betweenParens(
    P.sequenceOf([
      ParseDimensionWithUnits,
      P.whitespaceSurrounded(parseMathOperatorSymbol),
      ParseDimensionWithUnits,
    ]),
  ),
])
  .map((x) => x[1])
  .mapFromData((x) => {
    const left = x.result[0];
    const right = x.result[2];
    switch (x.result[1]) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        return left / right;
      default:
        return left;
    }
  });
