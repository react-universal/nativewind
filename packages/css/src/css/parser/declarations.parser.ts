import * as P from '@native-twin/arc-parser';
import type { AnyStyle } from '../../react-native/rn.types.js';
import { getPropertyValueType } from '../../utils.parser.js';
import { ident } from '../css-common.parser.js';
import { ParseCssDimensions } from './dimensions.parser.js';
import { ParseAspectRatio } from './resolvers/aspect-ratio.parser.js';
import { ParseShadowValue } from './resolvers/box-shadow.parser.js';
import { ParseCssColor } from './resolvers/color.parser.js';
import { ParseFlexValue } from './resolvers/flex.parser.js';
import { ParseRotateValue } from './resolvers/rotate.parser.js';
import { ParseSkewValue } from './resolvers/skew.parser.js';
import { ParseTranslateValue } from './resolvers/translate.parser.js';

export const ParseCssDeclarationLine = P.coroutine((run) => {
  const getValue = () => {
    const property = run(parseDeclarationProperty);
    const meta = getPropertyValueType(property);
    if (meta === 'DIMENSION') {
      return {
        [kebab2camel(property)]: run(ParseCssDimensions),
      };
    }
    if (meta === 'FLEX') {
      return run(ParseFlexValue);
    }

    if (meta === 'SHADOW') {
      return run(ParseShadowValue);
    }

    if (meta === 'MATH') {
      return run(ParseAspectRatio);
    }

    if (meta === 'TRANSFORM') {
      return {
        transform: run(P.choice([ParseTranslateValue, ParseRotateValue, ParseSkewValue])),
      };
    }

    if (meta === 'COLOR') {
      const value = run(ParseCssColor);
      return {
        [kebab2camel(property)]: value,
      };
    }

    //CSS:  .font-sans{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"}

    if (meta === 'FIRST-COMMA-IDENT') {
      const value = P.separatedByComma(
        P.many(P.choice([ident, P.whitespace, P.char('"')])),
      ).map((x) => {
        return x;
      });
      return {
        [kebab2camel(property)]: run(value)[0]![0],
      };
    }
    return {
      [kebab2camel(property)]: run(ident),
    };
  };

  const composeValue = (result: AnyStyle = {}): AnyStyle => {
    run(P.maybe(P.char(';')));
    const isValid = run(P.peek) !== '}' || run(P.peek) === '"';
    if (!isValid) return result;
    const value = {
      ...result,
      ...getValue(),
    };
    if (run(P.peek) === ';') {
      return composeValue(value);
    }
    return value;
  };

  return composeValue();
});

function kebab2camel(input: string) {
  if (!input.includes('-')) return input;
  return input.replace(/-./g, (x) => x.toUpperCase().charAt(1));
}

export const parseDeclarationProperty = P.sequenceOf([ident, P.char(':')]).map(
  (x) => x[0],
);
