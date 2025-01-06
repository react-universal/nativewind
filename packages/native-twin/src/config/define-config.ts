import { asArray } from '@native-twin/helpers';
import type {
  Preset,
  TailwindConfig,
  TailwindPresetConfig,
  TailwindUserConfig,
} from '../types/config.types.js';
import type { ExtractThemes, __Theme__ } from '../types/theme.types.js';
import { defaultVariants } from './defaults/variants.js';

export function defineConfig<
  Theme extends __Theme__ = __Theme__,
  Presets extends Preset<any>[] = Preset[],
>({
  presets = [] as unknown as Presets,
  ...userConfig
}: TailwindUserConfig<Theme, Presets>): TailwindConfig<
  __Theme__ & ExtractThemes<Theme, Presets>
> {
  let config: TailwindConfig<__Theme__ & ExtractThemes<Theme, Presets>> = {
    content: userConfig.content,
    darkMode: undefined,
    mode: userConfig.mode ?? 'native',
    preflight: userConfig.preflight !== false && [],
    ignorelist: asArray(userConfig.ignorelist),
    rules: asArray(userConfig.rules),
    variants: asArray(userConfig.variants).concat(defaultVariants),
    root: {
      rem: userConfig.root?.rem ?? 16,
      ...userConfig.root,
    },
    theme: {},
    animations: userConfig.animations ?? [],
  };
  for (const preset of asArray([
    ...presets,
    {
      presets: [],
      mode: userConfig.mode,
      darkMode: userConfig.darkMode,
      preflight: userConfig.preflight !== false && asArray(userConfig.preflight),
      theme: userConfig.theme as TailwindConfig<__Theme__>['theme'],
      root: userConfig.root,
    },
  ])) {
    const { ignorelist, preflight, rules, theme, variants, darkMode, animations } =
      typeof preset === 'function'
        ? preset(config)
        : (preset as TailwindPresetConfig<Theme>);
    config = {
      animations: [...asArray(config.animations), ...asArray(animations)],
      content: userConfig.content,
      preflight: config.preflight !== false &&
        preflight !== false && [...asArray(config.preflight), ...asArray(preflight)],
      root: config.root,
      mode: config.mode,
      darkMode,
      theme: {
        ...config.theme,
        ...theme,
        extend: {
          ...config.theme.extend,
          ...theme?.extend,
        },
      },

      variants: [...config.variants, ...asArray(variants)],
      rules: [...config.rules, ...asArray(rules)],
      ignorelist: [...config.ignorelist, ...asArray(ignorelist)],
    } as TailwindConfig<__Theme__ & ExtractThemes<Theme, Presets>>;
  }
  return config;
}
