import { createElement, forwardRef } from 'react';
import { cx, tw } from '@native-twin/core';
import type { JSXFunction, JSXInternalProps } from '../../types/jsx.types.js';
import { getNormalizeConfig } from '../../utils/config.utils.js';
import { REACT_FORWARD_REF_SYMBOL } from '../../utils/constants.js';

// TODO: Check this on every react web fmw
export const stylizedComponents = new Map<object | string, Parameters<JSXFunction>[0]>();

type JSXTarget = Record<string, any> | Record<string, any>[];
export const createStylableComponent = (baseComponent: any, mapping: any): any => {
  const configs = getNormalizeConfig(mapping);

  if (configs.length === 0) {
    configs.push({ source: 'className', target: 'style' });
  }

  /**
   * Turns this:
   *   <View className="text-red-500" />
   * Into this:
   *   <View style={{ $$css: true, "text-red-500": "text-red-500"}} />
   */
  const twinComponent = forwardRef(function TwinComponent(
    { ...props }: JSXInternalProps,
    ref: any,
  ) {
    if (props['twEnabled'] === false) {
      return createElement(baseComponent, props);
    }

    // if (typeof baseComponent === 'string') {
    //   return createElement(baseComponent, props);
    // }

    props = { ...props, ref };
    for (const config of configs) {
      const originalTarget: JSXTarget = props[config.target] ?? {};

      let target: JSXTarget = Array.isArray(originalTarget)
        ? [...originalTarget]
        : { ...originalTarget, $$css: true };
      let source = props[config.source];

      // Ensure we only add non-empty strings
      if (source && typeof source === 'string' && source.length > 0) {
        source = cx`${source}`;
        const injected = tw(`${source}`);
        if (injected && injected.length > 0) {
          if (Array.isArray(target)) {
            target.push({
              $$css: true,
              [source]: source,
            });
          } else {
            target = {
              ...target,
              [source]: source,
            };
          }
        }
        props[config.target] = target;
      }
    }

    if (
      '$$typeof' in baseComponent &&
      typeof baseComponent === 'function' &&
      baseComponent.$$typeof === REACT_FORWARD_REF_SYMBOL
    ) {
      delete props?.['twEnabled'];
      return (baseComponent as any).render(props, props['ref']);
    } else if (typeof baseComponent === 'function') {
      delete props?.['twEnabled'];
      return (baseComponent as any)(props);
    } else {
      return createElement(baseComponent, props);
    }
  });
  // if (typeof window !== 'undefined') {
  twinComponent.displayName = `Twin.${
    baseComponent.displayName ?? baseComponent.name ?? 'unknown'
  }`;
  // }

  stylizedComponents.set(baseComponent, twinComponent);
  return twinComponent;
};

export const withMappedProps = createStylableComponent;

export const useUnstableNativeVariable = (name: string) => {
  if (process.env['NODE_ENV'] !== 'production') {
    console.warn('useUnstableNativeVariable is not supported on web.');
  }
  return undefined;
};

export function vars<T extends Record<`--${string}`, string | number>>(variables: T) {
  const $variables: Record<string, string> = {};

  for (const [key, value] of Object.entries(variables)) {
    if (key.startsWith('--')) {
      $variables[key] = value.toString();
    } else {
      $variables[`--${key}`] = value.toString();
    }
  }
  return $variables;
}

export function useSafeAreaEnv(): {} | undefined {
  return undefined;
}
