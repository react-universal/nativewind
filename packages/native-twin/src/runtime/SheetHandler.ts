import type { AnyStyle, CompleteStyle, SheetEntryDeclaration } from '@native-twin/css';
import type { RuntimeJSXStyle } from '@native-twin/css/jsx';
import { parseCssValue } from '../parsers/values.parser';
import type { TwinRuntimeContext } from './runtime.context';
import { tw } from './tw';

export interface TwinRuntimeProp {
  prop: string;
  target: string;
  styles: {
    base: AnyStyle;
    even: AnyStyle;
    first: AnyStyle;
    group: AnyStyle;
    last: AnyStyle;
    odd: AnyStyle;
    pointer: AnyStyle;
    dark: AnyStyle;
  };
}

export const getSheetEntryStyles = (
  entries: RuntimeJSXStyle[],
  context: TwinRuntimeContext,
): TwinRuntimeProp['styles'] =>
  entries.reduce(
    (prev, current) => {
      const nextDecl = sheetEntryToStyle(current, context);
      if (!nextDecl) return prev;

      const group = current.group;
      if (nextDecl.transform && prev[group].transform) {
        nextDecl.transform = [...(prev[group].transform as any), ...nextDecl.transform];
      }
      Object.assign(prev[group], nextDecl);
      return prev;
    },
    {
      base: {},
      dark: {},
      even: {},
      first: {},
      group: {},
      last: {},
      odd: {},
      pointer: {},
    } as TwinRuntimeProp['styles'],
  );

export function composeDeclarations(
  declarations: SheetEntryDeclaration[],
  context: TwinRuntimeContext,
) {
  const styledCtx = {
    rem: context.units.rem,
    deviceHeight: context.deviceHeight,
    deviceWidth: context.deviceWidth,
  };
  return declarations.reduce((prev, current) => {
    let value: any = current.value;
    if (Array.isArray(current.value)) {
      value = [];
      for (const t of current.value) {
        if (typeof t.value === 'string') {
          if (t.value) {
            value.push({
              [t.prop]: parseCssValue(t.prop, t.value, styledCtx),
            });
          }
        }
      }
      Object.assign(prev, {
        transform: [...(prev['transform'] ?? []), ...value],
      });
      return prev;
    }
    if (typeof value === 'string') {
      value = parseCssValue(current.prop, value, styledCtx);
    }
    if (typeof value === 'object') {
      Object.assign(prev, value);
    } else {
      Object.assign(prev, {
        [current.prop]: value,
      });
    }

    return prev;
  }, {} as AnyStyle);
}

const platformVariants = ['web', 'native', 'ios', 'android'];
export const sheetEntryToStyle = (
  entry: RuntimeJSXStyle,
  context: TwinRuntimeContext,
): CompleteStyle | null => {
  const validRule = isApplicativeRule([entry.group], context);
  if (!validRule) return null;
  const nextDecl = composeDeclarations(entry.declarations, context);
  return nextDecl;
};

const isApplicativeRule = (variants: string[], context: TwinRuntimeContext) => {
  if (variants.length === 0) return true;
  const screens = tw?.theme('screens');

  for (let v of variants) {
    v = v.replace('&:', '');
    if (platformVariants.includes(v)) {
      if (v === 'web' && context.platform !== 'web') return false;
      if (v === 'native' && context.platform === 'web') return false;
      if (v === 'ios' && context.platform !== 'ios') return false;
      if (v === 'android' && context.platform !== 'android') return false;
      // if (v === 'web' && Platform.OS !== 'web') return false;
      // if (v === 'native' && Platform.OS === 'web') return false;
      // if (v === 'ios' && Platform.OS !== 'ios') return false;
      // if (v === 'android' && Platform.OS !== 'android') return false;
    }
    // if (
    //   (v ==== 'dark' && context.colorScheme ==== 'light') ||
    //   (v ==== 'light' && context.colorScheme ==== 'dark')
    // ) {
    //   return false;
    // }
    if (screens && v in screens) {
      const variant = screens[v];
      const width = context.deviceWidth;
      if (typeof variant === 'string') {
        const value = parseCssValue('min-width', variant, {
          deviceHeight: context.deviceHeight,
          deviceWidth: context.deviceWidth,
          rem: context.units.rem,
        }) as number;
        if (width >= Number(value)) {
          return false;
        }
      }

      if (typeof variant === 'object') {
        let min: null | number = null;
        let max: null | number = null;
        // if ('raw' in variant && !(width >= Number(variant.raw))) {
        if ('raw' in variant) {
          min = parseCssValue('min-width', variant.raw, {
            deviceHeight: context.deviceHeight,
            deviceWidth: context.deviceWidth,
            rem: context.units.rem,
          }) as number;
        }
        if ('min' in variant && variant.min) {
          min = parseCssValue('min-width', variant.min, {
            deviceHeight: context.deviceHeight,
            deviceWidth: context.deviceWidth,
            rem: context.units.rem,
          }) as number;
        }
        if ('max' in variant && variant.max) {
          max = parseCssValue('max-width', variant.max, {
            deviceHeight: context.deviceHeight,
            deviceWidth: context.deviceWidth,
            rem: context.units.rem,
          }) as number;
        }
        if (max && min && !(width <= max && width >= min)) {
          return false;
        }
        if (max && !(width <= max)) return false;
        if (min && !(width >= min)) return false;
      }
    }
  }
  return true;
};

// const sheetEntriesToStyles = (
//   entries: RuntimeJSXStyle[],
//   context: TwinRuntimeContext,
// ): CompleteStyle => {
//   return entries.reduce((prev, current) => {
//     const style = sheetEntryToStyle(current, context);
//     if (!style) return prev;

//     if (style && style.transform) {
//       style.transform = [...(style.transform as any), ...style.transform];
//     }
//     return {
//       ...prev,
//       ...style,
//     };
//   }, {} as AnyStyle);
// };
