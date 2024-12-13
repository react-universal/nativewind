import { flattenObjectByPath } from '@native-twin/helpers';
import type { ThemeFunction } from '../types/config.types.js';
import type { ThemeConfig, __Theme__ } from '../types/theme.types.js';

export function createThemeFunction<Theme extends __Theme__ = __Theme__>({
  extend = {},
  ...baseConfig
}: ThemeConfig<Theme>) {
  const resolved: Record<string, any> = {};
  return theme as ThemeFunction<Theme>;

  function theme(
    themeSection: keyof Omit<ThemeConfig<Theme>, 'extend'>,
    segment: string,
  ) {
    if (segment && segment.startsWith('[') && segment.endsWith(']')) {
      return segment.slice(1, -1);
    }
    let config = baseConfig[themeSection] ?? {};
    if (themeSection in extend) {
      config = Object.assign(config, extend[themeSection] ?? ({} as any));
    }
    if (!segment) return config;
    let value: any | undefined;
    if (segment && themeSection in resolved) {
      value = resolved[themeSection as string][segment];
    }
    if (!value && config) {
      const flatten = flattenObjectByPath(config);
      if (!flatten) return null;
      resolved[themeSection as string] = flatten;
      value = resolved[themeSection as string][segment];
    }
    return value;
  }
}
