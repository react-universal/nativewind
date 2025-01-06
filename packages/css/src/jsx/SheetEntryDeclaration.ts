import * as P from '@native-twin/arc-parser';
import { hasOwnProperty } from '@native-twin/helpers';
import { declarationValueWithUnitParser } from '../css/css-common.parser.js';
import { unitlessCssProps } from '../css/css.constants.js';
import type { CSSUnit } from '../css/css.types.js';
import type { AnyStyle } from '../react-native/rn.types.js';
import type { SheetEntryDeclaration } from '../sheets/sheet.types.js';
import {
  type DeclarationPropertyValueType,
  getPropertyValueType,
} from '../utils.parser.js';
import type { CompilerContext } from './metro.runtime.js';

export type CompilationError = 'Unknown' | 'PARSER' | (string & {});

export interface CompiledDeclaration extends SheetEntryDeclaration {
  readonly _tag: 'COMPILED';
}
export interface NotCompiledDeclaration extends SheetEntryDeclaration {
  readonly _tag: 'NOT_COMPILED';
  reason: CompilationError;
  isUnitLess: boolean;
  valueType: DeclarationPropertyValueType;
}
/** @category Tagged Types */
export type RuntimeSheetDeclaration = CompiledDeclaration | NotCompiledDeclaration;

/** @category Tagged Types */
export const RuntimeSheetDeclaration = {
  $is: (tag: RuntimeSheetDeclaration['_tag']) => (x: RuntimeSheetDeclaration) =>
    x._tag === tag,
  COMPILED: (declaration: SheetEntryDeclaration): CompiledDeclaration => ({
    _tag: 'COMPILED',
    ...declaration,
  }),
  NOT_COMPILED: (
    declaration: Omit<NotCompiledDeclaration, '_tag'>,
  ): NotCompiledDeclaration => ({
    _tag: 'NOT_COMPILED',
    ...declaration,
  }),
};

/** @category Parsers */
export const compileEntryDeclaration = (
  decl: SheetEntryDeclaration,
  ctx: CompilerContext,
): RuntimeSheetDeclaration => {
  const isUnitLess =
    !decl.prop.includes('flex') && hasOwnProperty.call(unitlessCssProps, decl.prop);

  if (Array.isArray(decl.value)) {
    const compiled = decl.value.map((x) => compileEntryDeclaration(x, ctx));
    if (compiled.every(RuntimeSheetDeclaration.$is('COMPILED'))) {
      return RuntimeSheetDeclaration.COMPILED({
        ...decl,
        value: compiled,
      });
    }
    return RuntimeSheetDeclaration.NOT_COMPILED({
      ...decl,
      isUnitLess,
      valueType: 'TRANSFORM',
      reason: 'Unknown',
    });
  }

  if (typeof decl.value === 'object') {
    return RuntimeSheetDeclaration.NOT_COMPILED({
      ...decl,
      isUnitLess,
      valueType: 'RAW',
      reason: 'Unknown',
    });
  }
  if (typeof decl.value === 'number') {
    return RuntimeSheetDeclaration.COMPILED(decl);
  }

  if (isUnitLess) {
    const data = parseUnitlessValue.run(decl.value);
    if (!data.isError) {
      return RuntimeSheetDeclaration.COMPILED({
        ...decl,
        value: data.result,
      });
    }
    return RuntimeSheetDeclaration.NOT_COMPILED({
      ...decl,
      isUnitLess,
      valueType: 'RAW',
      reason: data.error ?? 'PARSER',
    });
  }

  const type = getPropertyValueType(
    decl.prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
  );

  if (type === 'DIMENSION') {
    const data = declarationValueConvertParser(ctx).run(decl.value);
    if (!data.isError && data.result) {
      return RuntimeSheetDeclaration.COMPILED({
        ...decl,
        value: data.result,
      });
    }
    if (data.isError) {
      return RuntimeSheetDeclaration.NOT_COMPILED({
        ...decl,
        isUnitLess,
        valueType: 'DIMENSION',
        reason: data.error ?? 'PARSER',
      });
    }
  }

  if (type === 'FLEX') {
    const data = ParseFlexValue(ctx).run(decl.value);
    if (!data.isError && data.result) {
      return RuntimeSheetDeclaration.COMPILED({
        ...decl,
        value: data.result,
      });
    }
    if (data.isError) {
      return RuntimeSheetDeclaration.NOT_COMPILED({
        ...decl,
        isUnitLess,
        valueType: 'FLEX',
        reason: data.error ?? 'PARSER',
      });
    }
  }

  return RuntimeSheetDeclaration.COMPILED(decl);
};

/** @category Parsers */
const parseUnitlessValue = P.float.map((x) => Number(x));

/** @category Parsers */
export const declarationValueConvertParser = (ctx: CompilerContext) =>
  P.withData(declarationValueWithUnitParser)<CompilerContext>(ctx).mapFromData(
    ({ result, data }) => {
      if (!result[1]) return result[0];
      const converted = matchUnitConvert(result[1].value);
      return converted(result[0], data.baseRem);
    },
  );

/** @category Parsers */
const ParseFlexValue = (ctx: CompilerContext) =>
  P.withData(
    P.choice([
      P.sequenceOf([
        declarationValueConvertParser(ctx),
        P.maybe(declarationValueConvertParser(ctx)),
        P.maybe(P.choice([declarationValueConvertParser(ctx), P.literal('auto')])),
      ]).map(([flexGrow, flexShrink, flexBasis]) => {
        if (!flexGrow) return null;
        return {
          flexGrow: Number.parseFloat(String(flexGrow)),
          flexShrink: Number.parseFloat(String(flexShrink ?? flexGrow)),
          flexBasis: (flexBasis as AnyStyle['flexBasis']) ?? '0%',
        };
      }),
      P.literal('none').map((x) => ({
        flex: x as any as number,
      })),
    ]),
  )(ctx);

/** @category Match */
export const matchUnitConvert = (unit: CSSUnit) => {
  switch (unit) {
    case 'px':
      return (value: string) => Number.parseFloat(value);
    case 'em':
    case 'rem':
      return (value: string, rem: number) => Number.parseFloat(value) * rem;
    case '%':
      return (value: string) => `${value}%`;
    case 'vh':
    case 'vw':
    case 'vmin':
    case 'vmax':
      return (_v: string) => null;
    case 'deg':
      return (value: string) => `${value}${unit}`;
    case 'rad':
    case 'turn':
      return (value: string) => `${360 * Number.parseFloat(value)}deg`;
    case 'pc':
      return (value: string) => Number.parseFloat(value) * (96 / 6);
    case 'in':
      return (value: string) => Number.parseFloat(value) * 96;
    case 'pt':
      return (value: string) => Number.parseFloat(value) * (96 / 72);
    case 'cm':
      return (value: string) => Number.parseFloat(value) * 97.8;
    case 'mm':
      return (value: string) => Number.parseFloat(value) * (97.8 / 10);
    case 'Q':
      return (value: string) => Number.parseFloat(value) * (97.8 / 40);
    default:
      return () => null;
  }
};
// Match.type<CSSUnit>().pipe(
//   Match.when(
//     (x) => x === 'px',
//     (_) => (value: string) => Number.parseFloat(value),
//   ),
//   Match.when(
//     (x) => x === 'rem' || x === 'em',
//     (_) => (value: string, rem: number) => Number.parseFloat(value) * rem,
//   ),
//   Match.when(
//     (x) => x === '%',
//     (_) => (value: string) => `${value}%`,
//   ),
//   Match.when(
//     (x) => x === 'vh' || x === 'vw' || x === 'vmax' || x === 'vmin',
//     (_) => (_v: string) => null,
//   ),
//   Match.when(
//     (x) => x === 'turn',
//     (_) => (value: string) => `${360 * Number.parseFloat(value)}deg`,
//   ),
//   Match.when(
//     (x) => x === 'deg' || x === 'rad',
//     (u) => (value: string) => `${value}${u}`,
//   ),
//   Match.when(
//     (x) => x === 'in',
//     (_) => (value: string) => Number.parseFloat(value) * 96,
//   ),
//   Match.when(
//     (x) => x === 'pc',
//     (_) => (value: string) => Number.parseFloat(value) * (96 / 6),
//   ),
//   Match.when(
//     (x) => x === 'pt',
//     (_) => (value: string) => Number.parseFloat(value) * (96 / 72),
//   ),
//   Match.when(
//     (x) => x === 'cm',
//     (_) => (value: string) => Number.parseFloat(value) * 97.8,
//   ),
//   Match.when(
//     (x) => x === 'mm',
//     (_) => (value: string) => Number.parseFloat(value) * (97.8 / 10),
//   ),
//   Match.when(
//     (x) => x === 'Q',
//     (_) => (value: string) => Number.parseFloat(value) * (97.8 / 40),
//   ),
//   Match.orElse((_) => (_value: string) => null),
// );
