import { createElement, forwardRef } from 'react';
// import { globalStyles, opaqueStyles } from '../../store/styles.store.js';
import type {
  ReactComponent,
  StylableComponentConfigOptions,
} from '../../types/styled.types.js';
import { getNormalizeConfig } from '../../utils/config.utils.js';
import { stylizedComponents } from './createTwinCmp.web.js';

export const withMappedProps = <
  const T extends ReactComponent<any>,
  const M extends StylableComponentConfigOptions<any>,
>(
  component: any,
  mapping: StylableComponentConfigOptions<T> & M,
): any => {
  if (!mapping) {
    // @ts-expect-error
    mapping = {
      source: 'className',
      target: 'style',
    };
  }
  const configs = getNormalizeConfig(mapping);

  const twinComponent = forwardRef(function RemapPropsComponent(
    { ...props }: Record<string, any>,
    ref: any,
  ) {
    for (const config of configs) {
      const rawStyles = [];

      const source = props?.[config.source];

      // If the source is not a string or is empty, skip this config
      if (typeof source !== 'string' || !source) continue;

      delete props[config.source];

      // for (const className of source.split(/\s+/)) {
      // const signal = globalStyles.get(className);
      // if (signal !== undefined) {
      //   const style = {};
      //   const styleRuleSet = signal.get();
      //   opaqueStyles.set(style, styleRuleSet);
      //   rawStyles.push(style);
      // }
      // }

      if (rawStyles.length !== 0) {
        const existingStyle = props[config.target];

        if (Array.isArray(existingStyle)) {
          rawStyles.push(...existingStyle);
        } else if (existingStyle) {
          rawStyles.push(existingStyle);
        }

        props[config.target] = rawStyles.length === 1 ? rawStyles[0] : rawStyles;
      }
    }

    props['ref'] = ref;
    return createElement(component as any, props, props['children']);
  });

  stylizedComponents.set(component as any, twinComponent);
  return twinComponent;
};
