import { parseCssValue, tw } from '@native-twin/core';
import {
  type AnyStyle,
  type FinalSheet,
  type GetChildStylesArgs,
  type RuntimeContext,
  type SheetEntry,
  type SheetEntryDeclaration,
  type SheetInteractionState,
  getRuleSelectorGroup,
} from '@native-twin/css';
import { useId, useMemo } from 'react';
import { Platform } from 'react-native';
import { useStyledContext } from './useStyledContext.js';

export function useCssToRN(className: string) {
  const componentID = useId();
  const { context } = useStyledContext();
  const stylesheet = useMemo(() => {
    return createComponentSheet(tw(className), context);
  }, [className, context]);

  return { stylesheet, componentID };
}

export function createComponentSheet(entries: SheetEntry[], context: RuntimeContext) {
  const sheet = getSheetEntryStyles(entries, context);
  return {
    getChildStyles,
    getStyles,
    sheet,
    metadata: {
      isGroupParent: entries.some((x) => x.className === 'group'),
      hasGroupEvents: Object.keys(sheet.group).length > 0,
      hasPointerEvents: Object.keys(sheet.pointer).length > 0,
    },
  };
  function getStyles(input: SheetInteractionState) {
    const styles: AnyStyle = { ...sheet.base };
    if (input.isPointerActive) Object.assign(styles, { ...sheet.pointer });
    if (input.isParentActive) Object.assign(styles, { ...sheet.group });
    return styles;
  }

  function getChildStyles(input: GetChildStylesArgs) {
    const result: AnyStyle = {};
    if (input.isFirstChild) {
      Object.assign(result, sheet.first);
    }
    if (input.isLastChild) {
      Object.assign(result, sheet.last);
    }
    if (input.isEven) {
      Object.assign(result, sheet.even);
    }
    if (input.isOdd) {
      Object.assign(result, sheet.odd);
    }
    return Object.freeze(result);
  }
}

function getSheetEntryStyles(entries: SheetEntry[], context: RuntimeContext) {
  return entries.reduce(
    (prev, current) => {
      const validRule = isApplicativeRule(current.selectors, context);
      if (!validRule) return prev;
      const nextDecl = composeDeclarations(current.declarations, context);
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
    } as FinalSheet,
  );
}

function composeDeclarations(
  declarations: SheetEntryDeclaration[],
  context: RuntimeContext,
) {
  return declarations.reduce((prev, current) => {
    let value: any = current.value;
    if (Array.isArray(current.value)) {
      value = [];
      for (const t of current.value) {
        if (typeof t.value === 'string') {
          value.push({
            [t.prop]: parseCssValue(t.prop, t.value, {
              rem: tw.config.root?.rem ?? context.units.rem,
              deviceHeight: context.deviceHeight,
              deviceWidth: context.deviceWidth,
            }),
          });
        }
      }
      Object.assign(prev, {
        transform: [...(prev['transform'] ?? []), ...value],
      });
      return prev;
    }
    if (typeof value === 'string') {
      value = parseCssValue(current.prop, value, {
        rem: tw.config.root?.rem ?? context.units.rem,
        deviceHeight: context.deviceHeight,
        deviceWidth: context.deviceWidth,
      });
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
function isApplicativeRule(variants: string[], context: RuntimeContext) {
  if (variants.length === 0) return true;
  const screens = tw.theme('screens');
  for (let v of variants) {
    v = v.replace('&:', '');
    if (platformVariants.includes(v)) {
      if (v === 'web' && Platform.OS !== 'web') return false;
      if (v === 'native' && Platform.OS === 'web') return false;
      if (v === 'ios' && Platform.OS !== 'ios') return false;
      if (v === 'android' && Platform.OS !== 'android') return false;
    }
    for (let v of variants) {
      v = v.replace('&:', '');
      if (platformVariants.includes(v)) {
        if (v === 'web' && Platform.OS !== 'web') return false;
        if (v === 'native' && Platform.OS === 'web') return false;
        if (v === 'ios' && Platform.OS !== 'ios') return false;
        if (v === 'android' && Platform.OS !== 'android') return false;
      }
      // if (
      //   (v === 'dark' && context.colorScheme === 'light') ||
      //   (v === 'light' && context.colorScheme === 'dark')
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
          console.log('MAX_MIN', max, min);
          if (max && min && !(width <= max && width >= min)) {
            return false;
          }
          if (max && !(width <= max)) return false;
          if (min && !(width >= min)) return false;
        }
      }
    }
  }
  return true;
}
