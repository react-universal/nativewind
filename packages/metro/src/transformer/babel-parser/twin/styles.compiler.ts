import { parseCssValue, RuntimeTW } from '@native-twin/core';
import {
  AnyStyle,
  FinalSheet,
  getRuleSelectorGroup,
  SheetEntry,
  SheetEntryDeclaration,
} from '@native-twin/css';
import { platformVariants } from '../../../utils/constants';

export function getSheetEntryStyles(entries: SheetEntry[] = [], tw: RuntimeTW) {
  return entries.reduce(
    (prev, current) => {
      const validRule = isApplicativeRule(current.selectors, tw);
      if (!validRule) return prev;
      const nextDecl = composeDeclarations(current.declarations, tw);
      const group = getRuleSelectorGroup(current.selectors);
      if (nextDecl.transform && prev[group].transform) {
        nextDecl.transform = [...(prev[group].transform as any), ...nextDecl.transform];
      }
      Object.assign(prev[group], nextDecl);
      return prev;
    },
    {
      base: {},
      even: {},
      first: {},
      group: {},
      last: {},
      odd: {},
      pointer: {},
      dark: {},
    } as FinalSheet,
  );
}

export function composeDeclarations(
  declarations: SheetEntryDeclaration[],
  tw: RuntimeTW,
) {
  const styledCtx = {
    rem: tw.config.root.rem,
    deviceHeight: 1000,
    deviceWidth: 1000,
  };
  return declarations.reduce((prev, current) => {
    let value: any = current.value;
    if (Array.isArray(current.value)) {
      value = [];
      for (const t of current.value) {
        if (typeof t.value == 'string') {
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
    if (typeof value == 'string') {
      value = parseCssValue(current.prop, value, styledCtx);
    }
    if (typeof value == 'object') {
      Object.assign(prev, value);
    } else {
      Object.assign(prev, {
        [current.prop]: value,
      });
    }

    return prev;
  }, {} as AnyStyle);
}

export function isApplicativeRule(variants: string[], tw: RuntimeTW) {
  if (variants.length == 0) return true;
  const screens = tw.theme('screens');

  for (let v of variants) {
    v = v.replace('&:', '');
    if (platformVariants.includes(v)) {
      // if (v == 'web' && context.platform != 'web') return false;
      // if (v == 'native' && context.platform == 'web') return false;
      // if (v == 'ios' && context.platform != 'ios') return false;
      // if (v == 'android' && context.platform != 'android') return false;
      // if (v == 'web' && Platform.OS != 'web') return false;
      // if (v == 'native' && Platform.OS == 'web') return false;
      // if (v == 'ios' && Platform.OS != 'ios') return false;
      // if (v == 'android' && Platform.OS != 'android') return false;
    }
    // if (
    //   (v === 'dark' && context.colorScheme === 'light') ||
    //   (v === 'light' && context.colorScheme === 'dark')
    // ) {
    //   return false;
    // }
    if (screens && v in screens) {
      const variant = screens[v];
      const width = 10000;
      if (typeof variant === 'string') {
        const value = parseCssValue('min-width', variant, {
          deviceHeight: 1000,
          deviceWidth: 1000,
          rem: tw.config.root.rem,
        }) as number;
        if (width >= Number(value)) {
          return false;
        }
      }

      if (typeof variant == 'object') {
        let min: null | number = null;
        let max: null | number = null;
        // if ('raw' in variant && !(width >= Number(variant.raw))) {
        if ('raw' in variant) {
          min = parseCssValue('min-width', variant.raw, {
            deviceHeight: 1000,
            deviceWidth: 1000,
            rem: tw.config.root.rem,
          }) as number;
        }
        if ('min' in variant && variant.min) {
          min = parseCssValue('min-width', variant.min, {
            deviceHeight: 1000,
            deviceWidth: 1000,
            rem: tw.config.root.rem,
          }) as number;
        }
        if ('max' in variant && variant.max) {
          max = parseCssValue('max-width', variant.max, {
            deviceHeight: 1000,
            deviceWidth: 1000,
            rem: tw.config.root.rem,
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
}
