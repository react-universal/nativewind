import type { ColorSchemeName, PlatformOSType } from 'react-native';

export type CssUnitsContext = {
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

export type RuntimeContext = {
  orientation: 'portrait' | 'landscape';
  resolution: number;
  fontScale: number;
  deviceWidth: number;
  deviceHeight: number;
  deviceAspectRatio: number;
  platform: PlatformOSType;
  colorScheme: 'dark' | 'light';
  units: CssUnitsContext;
};

export function createStyledContext(
  units: Pick<CssUnitsContext, 'rem' | 'vh' | 'vw'>,
  colorScheme: ColorSchemeName,
  resolution: number,
  fontScale: number,
  platform: PlatformOSType,
): RuntimeContext {
  const vw = units.vw ?? 1;
  const vh = units.vh ?? 1;
  return {
    colorScheme: colorScheme ?? 'light',
    deviceAspectRatio: vw / vh,
    deviceHeight: vh,
    deviceWidth: vw,
    orientation: vw > vh ? 'landscape' : 'portrait',
    resolution,
    fontScale,
    platform,
    units: {
      rem: units.rem,
      em: units.rem,
      cm: 37.8,
      mm: 3.78,
      in: 96,
      pt: 1.33,
      pc: 16,
      px: 1,
      vmin: vw < vh ? vw : vh,
      vmax: vw > vh ? vw : vh,
      vw,
      vh,
    },
  };
}
