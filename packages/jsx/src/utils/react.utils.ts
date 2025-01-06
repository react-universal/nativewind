import type { ComponentType, ElementType } from 'react';
import type { ComponentConfig } from '../types/styled.types.js';
import { REACT_FORWARD_REF_SYMBOL } from './constants.js';

export function getComponentType(component: any) {
  switch (typeof component) {
    case 'function':
    case 'object':
      return '$$typeof' in component && component.$$typeof === REACT_FORWARD_REF_SYMBOL
        ? 'forwardRef'
        : component.prototype?.isReactComponent
          ? 'class'
          : typeof component;
    default:
      return 'unknown';
  }
}

export const externalCallbackRef = {} as {
  current: ((className: string) => void) | undefined;
};

/**
 * Mutates the props object to move native styles to props
 * @param props
 * @param config
 */
export function nativeStyleToProp(props: Record<string, any>, config: ComponentConfig) {
  if (config.target !== 'style' || !config.nativeStyleToProp) return;
  for (const move of Object.entries(config.nativeStyleToProp)) {
    const source = move[0];
    const sourceValue = props[config.target]?.[source];
    if (sourceValue === undefined) continue;
    const targetProp = move[1] === true ? move[0] : move[1];
    props[targetProp] = sourceValue;
    delete props[config.target][source];
  }
}

export function getComponentDisplayName(
  primitive: ComponentType<any> | ElementType,
): string {
  if (typeof primitive === 'string') {
    return primitive;
  }
  return primitive.displayName ?? primitive.name ?? 'NoName';
}
