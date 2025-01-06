import { type ComponentType, createElement } from 'react';
import type { ComponentConfig } from '../../types/styled.types.js';
import { getComponentType } from '../../utils/react.utils.js';

export function twinComponent(
  baseComponent: ComponentType<any>,
  configs: ComponentConfig[],
  props: Record<string, any> | null,
  ref: any,
) {
  const component = baseComponent;
  // const renderCount = useRef(0);

  props = Object.assign({ ref }, props);

  // for (const x of configs) {
  //   if (x.target !== x.source) {
  //     delete props[x.source];
  //   }
  // }

  if (component === baseComponent) {
    switch (getComponentType(component)) {
      case 'forwardRef': {
        const ref = props['ref'];
        delete props['ref'];
        return (component as any).render(props, ref);
      }
      case 'function':
        return (component as any)(props);
      case 'string':
      case 'object':
      case 'class':
      case 'unknown':
        return createElement(component, props);
    }
  } else {
    return createElement(component, props);
  }
}
