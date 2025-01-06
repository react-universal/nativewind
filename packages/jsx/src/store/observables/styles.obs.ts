import type { TwinRuntimeContext } from '@native-twin/core';
import { atom } from '@native-twin/helpers/react';
import { PixelRatio, Platform } from 'react-native';
import { colorScheme } from './colorScheme.obs.js';
import { viewport } from './viewport.obs.js';

export const remObs = atom(14);

export const styledContext = atom((get): TwinRuntimeContext => {
  const { height: vh$, width: vw$ } = get(viewport);
  const rem = get(remObs);
  const colorSc = get(colorScheme) ?? 'light';
  return {
    colorScheme: colorSc,
    deviceAspectRatio: vw$ / vh$,
    deviceHeight: vh$,
    deviceWidth: vw$,
    orientation: vw$ > vh$ ? 'landscape' : 'portrait',
    resolution: PixelRatio.getPixelSizeForLayoutSize(vw$),
    fontScale: PixelRatio.getFontScale(),
    platform: Platform.OS,
    units: {
      rem,
      em: rem,
      cm: 37.8,
      mm: 3.78,
      in: 96,
      pt: 1.33,
      pc: 16,
      px: 1,
      vmin: vw$ < vh$ ? vw$ : vh$,
      vmax: vw$ > vh$ ? vw$ : vh$,
      vw: vw$,
      vh: vh$,
    },
  };
});
