import { type MaybeArray, asArray } from '@native-twin/helpers';
import type { SelectorGroup } from '../css/css.types.js';
import type { TWScreenValueConfig } from './tailwind.types.js';

const matchGroup = (variants: string[], group: SelectorGroup) => {
  return variants.some((x) => x === group || new RegExp(`(&)?(:?)?(${group})`).test(x));
};
export function getRuleSelectorGroup(variants: string[]): SelectorGroup {
  if (variants.length === 0) return 'base';
  if (
    variants.includes('group') ||
    variants.includes('group-hover') ||
    variants.includes('group-active') ||
    variants.includes('group-focus')
  )
    return 'group';

  if (variants.includes('dark')) return 'dark';
  if (matchGroup(variants, 'odd') || variants.includes('odd')) return 'odd';
  if (matchGroup(variants, 'even') || variants.includes('even')) return 'even';
  if (matchGroup(variants, 'first') || variants.includes('first')) return 'first';
  if (matchGroup(variants, 'last') || variants.includes('last')) return 'last';
  if (
    variants.includes('hover') ||
    variants.includes('focus') ||
    variants.includes('active')
  )
    return 'pointer';
  return 'base';
}

export function mql(screen: MaybeArray<TWScreenValueConfig>, prefix = '@media '): string {
  // if (!screen) return '';
  return (
    prefix +
    asArray(screen)
      .map((screen) => {
        if (typeof screen === 'string') {
          screen = { min: screen };
        }

        return (
          (screen as { raw?: string }).raw ||
          Object.keys(screen)
            .map(
              (feature) =>
                `(${feature}-width:${(screen as Record<string, string>)[feature]})`,
            )
            .join(' and ')
        );
      })
      .join(',')
  );
}
