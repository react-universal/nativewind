import { parseCssValue } from '@native-twin/core';
import {
  type AnyStyle,
  type SheetEntry,
  type SheetEntryDeclaration,
  getRuleSelectorGroup,
} from '@native-twin/css';
import type { PlatformOSType } from 'react-native';

export function getSheetEntryStyles(entries: SheetEntry[] = [], context: StyledContext) {
  return entries.reduce(
    (prev, current) => {
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
    } as Record<string, any>,
  );
}

export function composeDeclarations(
  declarations: SheetEntryDeclaration[],
  context: StyledContext,
) {
  return declarations.reduce((prev, current) => {
    let value: any = current.value;
    if (Array.isArray(current.value)) {
      value = [];
      for (const t of current.value) {
        if (typeof t.value === 'string') {
          value.push({
            [t.prop]: parseCssValue(t.prop, t.value, {
              rem: context.units.rem,
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
        rem: context.units.rem,
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

export function createStyledContext(rem: number): StyledContext {
  return {
    colorScheme: 'dark',
    deviceAspectRatio: 1 / 3,
    deviceHeight: 1000,
    deviceWidth: 720,
    orientation: 'portrait',
    resolution: 720,
    fontScale: 1,
    platform: 'web',
    units: {
      rem,
      em: rem,
      cm: 37.8,
      mm: 3.78,
      in: 96,
      pt: 1.33,
      pc: 16,
      px: 1,
      vmin: 720,
      vmax: 1000,
      vw: 1000,
      vh: 720,
    },
  };
}

export type Units = {
  '%'?: number;
  vw?: number;
  vh?: number;
  vmin?: number;
  vmax?: number;
  em: number;
  rem: number;
  px: number;
  pt: number;
  pc: number;
  in: number;
  cm: number;
  mm: number;
};

export type StyledContext = {
  orientation: 'portrait' | 'landscape';
  resolution: number;
  fontScale: number;
  deviceWidth: number;
  deviceHeight: number;
  deviceAspectRatio: number;
  platform: PlatformOSType;
  colorScheme: 'dark' | 'light';
  units: Units;
};
