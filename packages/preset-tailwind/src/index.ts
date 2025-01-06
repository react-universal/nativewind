import type { Preset } from '@native-twin/core';
import { themeRules } from './tailwind-rules/index.js';
import * as tailwindTheme from './tailwind-theme/index.js';
import { preflight } from './tailwind-theme/preflight.js';
import type { TailwindPresetTheme } from './types/theme.types.js';

export type { TailwindPresetTheme };
export interface TailwindPresetBaseOptions {
  colors?: TailwindPresetTheme['colors'];
  /** Allows to disable to tailwind preflight (default: `false` eg include the tailwind preflight ) */
  disablePreflight?: boolean | undefined;
}

export function presetTailwind({
  colors,
  disablePreflight,
}: TailwindPresetBaseOptions = {}): Preset<TailwindPresetTheme> {
  let userColors: TailwindPresetTheme['colors'] = {};
  if (colors) {
    userColors = {
      inherit: 'inherit',
      current: 'currentColor',
      transparent: 'transparent',
      black: '#000',
      white: '#fff',
      ...colors,
    };
  } else {
    userColors = tailwindTheme.colors;
  }
  return {
    // allow other preflight to run
    preflight: disablePreflight ? undefined : preflight,
    theme: {
      ...tailwindTheme,
      ...tailwindTheme.theme,
      colors: {
        ...userColors,
      },
    },
    rules: themeRules,
  };
}
