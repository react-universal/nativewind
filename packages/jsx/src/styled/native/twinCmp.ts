import { ComponentType, createElement, forwardRef, useId } from 'react';
import { groupContext } from '../../context/index.js';
import type { ComponentConfig } from '../../types/styled.types.js';
import { getComponentType } from '../../utils/react.utils.js';
import { useStyledProps } from '../hooks/useStyledProps.js';

export function twinComponent(
  baseComponent: ComponentType<any>,
  configs: ComponentConfig[],
  props: Record<string, any> | null,
  ref: any,
) {
  let component = baseComponent;
  const reactID = useId();
  const componentID = props?.['_twinComponentID'];
  const id = componentID ?? reactID;
  const { componentStyles } = useStyledProps(id, props ?? {}, configs);

  props = Object.assign({ ref }, props);

  for (const x of configs) {
    if (x.target !== x.source) {
      delete props[x.source];
    }
  }

  // if (
  //   componentStyles.metadata.hasPointerEvents ||
  //   componentStyles.metadata.hasGroupEvents ||
  //   componentStyles.metadata.isGroupParent
  // ) {
  //   if (!props['onTouchStart']) {
  //     props['onTouchStart'] = (event: unknown) => {
  //       ref?.['onTouchStart']?.(event);
  //       onChange(true);
  //     };
  //   }
  //   if (!props['onTouchEnd']) {
  //     props['onTouchEnd'] = (event: unknown) => {
  //       ref?.['onTouchEnd']?.(event);
  //       onChange(false);
  //     };
  //   }
  // }

  if (componentStyles.metadata.hasAnimations && 1 === Number(2)) {
    component = createAnimatedComponent(component);
  }

  if (componentStyles.metadata.isGroupParent) {
    props = {
      value: componentID ?? id,
      children: createElement(component, props),
    };
    component = groupContext.Provider;
  }

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

const animatedCache = new Map<ComponentType<any> | string, ComponentType<any>>();

function createAnimatedComponent(Component: ComponentType<any>): any {
  if (animatedCache.has(Component)) {
    return animatedCache.get(Component)!;
  } else if (Component.displayName?.startsWith('AnimatedComponent')) {
    return Component;
  }

  if (
    !(
      typeof Component !== 'function' ||
      (Component.prototype && Component.prototype.isReactComponent)
    )
  ) {
    throw new Error(
      `Looks like you're passing an animation style to a function component \`${Component.name}\`. Please wrap your function component with \`React.forwardRef()\` or use a class component instead.`,
    );
  }

  const { default: Animated, useAnimatedStyle } =
    require('react-native-reanimated') as typeof import('react-native-reanimated');

  let AnimatedComponent = Animated.createAnimatedComponent(
    Component as React.ComponentClass,
  );

  /**
   * TODO: This wrapper shouldn't be needed, as we should just run the hook in the
   * original component. However, we get an error about running on the JS thread?
   */
  const AnimatedComponentWrapper = forwardRef((props: any, ref: any) => {
    /**
     * This code shouldn't be needed, but inline shared values are not working properly.
     * https://github.com/software-mansion/react-native-reanimated/issues/5296
     */
    const propStyle = props.style;
    const style = useAnimatedStyle(() => {
      const style: Record<string, any> = {};

      if (!propStyle) return style;

      for (const key of Object.keys(propStyle)) {
        const value = propStyle[key];

        if (typeof value === 'object' && '_isReanimatedSharedValue' in value) {
          style[key] = value.value;
        } else if (key === 'transform') {
          style['transform'] = value.map((v: any) => {
            const [key, value] = Object.entries(v)[0] as any;
            if (typeof value === 'object' && 'value' in value) {
              return { [key]: value.value };
            } else {
              return { [key]: value };
            }
          });
        } else {
          style[key] = value;
        }
      }

      return style;
    }, [propStyle]);

    return createElement(AnimatedComponent, {
      ...props,
      style,
      ref,
    });
  });
  AnimatedComponentWrapper.displayName = `TwinAnimatedComponentWrapper(${
    Component.displayName ?? Component.name
  })`;

  animatedCache.set(Component, AnimatedComponentWrapper);

  return AnimatedComponentWrapper;
}
