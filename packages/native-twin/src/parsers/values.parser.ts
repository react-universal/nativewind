import * as P from '@native-twin/arc-parser';
import {
  declarationValueWithUnitParser,
  getPropertyValueType,
  unitlessCssProps,
} from '@native-twin/css';
import { hasOwnProperty } from '@native-twin/helpers';
import type { FlexStyle } from 'react-native';

interface ParserRuntimeContext {
  rem: number;
  deviceHeight: number;
  deviceWidth: number;
}

export const parseCssValue = (
  prop: string,
  value: string,
  context: {
    rem: number;
    deviceHeight: number;
    deviceWidth: number;
  },
) => {
  const isUnitLess =
    !prop.includes('flex') && hasOwnProperty.call(unitlessCssProps, prop);
  if (isUnitLess) {
    const data = parseUnitlessValue.run(value);
    if (!data.isError) return data.result;
    return value;
  }
  const type = getPropertyValueType(
    prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
  );
  if (type === 'DIMENSION') {
    const data = ParseDimensionWithUnits(context).run(value);
    if (!data.isError) return data.result;
    return value;
  }
  if (type === 'FLEX') {
    const data = ParseFlexValue(context).run(value);
    if (!data.isError) return data.result;
    return value;
  }
  return value;
};

const parseUnitlessValue = P.float.map((x) => Number(x));

const ParseCssDimensions = (context: {
  rem: number;
  deviceHeight: number;
  deviceWidth: number;
}) => P.choice([P.whitespaceSurrounded(ParseDimensionWithUnits(context))]);

export const ParseFlexValue = (context: ParserRuntimeContext) =>
  P.choice([
    P.sequenceOf([
      ParseCssDimensions(context),
      P.maybe(ParseCssDimensions(context)),
      P.maybe(P.choice([ParseCssDimensions(context), P.literal('auto')])),
    ]).map(
      ([flexGrow, flexShrink, flexBasis]): FlexStyle => ({
        flexGrow,
        flexShrink: flexShrink ?? flexGrow,
        flexBasis: flexBasis ?? '0%',
      }),
    ),
    P.literal('none').map((x) => ({
      flex: x,
    })),
  ]);

export const ParseDimensionWithUnits = (context: {
  rem: number;
  deviceHeight: number;
  deviceWidth: number;
}) =>
  declarationValueWithUnitParser
    // .chain((result) => {
    //   if (result[1]) {
    //     if (
    //       result[1].value === 'vh' ||
    //       result[1].value === 'vw' ||
    //       result[1].value === 'vmin' ||
    //       result[1].value === 'vmax'
    //     ) {
    //       return P.fail('Dimensions not provided');
    //     }
    //   }
    //   return P.succeedWith(result);
    // })
    .map((result) => {
      const value = Number.parseFloat(result[0]);
      switch (result[1]?.value) {
        case 'px':
          return value;
        case 'rem':
        case 'em':
          return value * context.rem;
        case '%':
          return `${value}%` as unknown as number;
        case 'vh':
          return context.deviceHeight * (value / 100);
        case 'vw':
          return context.deviceWidth * (value / 100);
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
