import { createElement, forwardRef } from 'react';
import { groupContext } from '../../context/styled.context.js';
import type { JSXFunction } from '../../types/jsx.types.js';
import type {
  ReactComponent,
  StylableComponentConfigOptions,
} from '../../types/styled.types.js';
import { getNormalizeConfig } from '../../utils/config.utils.js';
import { getComponentDisplayName } from '../../utils/react.utils.js';
import { useStyledProps } from '../hooks/useStyledProps.js';

export const stylizedComponents = new Map<object | string, Parameters<JSXFunction>[0]>();

export const NativeTwinHOC = <
  const T extends ReactComponent<any>,
  const M extends StylableComponentConfigOptions<any>,
>(
  Component: Parameters<JSXFunction>[0],
  mapping: StylableComponentConfigOptions<T> & M,
) => {
  const component = Component;
  const configs = getNormalizeConfig(mapping);

  const TwinComponent = forwardRef((props: any, ref: any) => {
    const { componentHandler, compiledProps, handlers } = useStyledProps(props, configs);

    const newProps = {
      ...props,
      ...handlers,
    };

    if (compiledProps.length > 0) {
      for (const style of compiledProps) {
        const oldProps = newProps[style.target] ? { ...newProps[style.target] } : {};
        newProps[style.target] = Object.assign(style.styles, oldProps);
      }
    }

    if (componentHandler.metadata.isGroupParent) {
      return createElement(
        groupContext.Provider,
        {
          value: componentHandler.id,
        },
        createElement(component, { ...newProps, ref }),
      );
    }

    return createElement(component, { ...newProps, ref });
  });
  stylizedComponents.set(Component, TwinComponent);

  if (__DEV__) {
    TwinComponent.displayName = `Twin(${getComponentDisplayName(Component)})`;
  }

  return TwinComponent;
};

export const createStylableComponent = NativeTwinHOC;
