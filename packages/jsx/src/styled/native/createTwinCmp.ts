import { createElement, forwardRef, useId } from 'react';
// import { groupContext } from '../../context/index.js';
// import { colorScheme } from '../../store/observables/index.js';
import type { JSXFunction } from '../../types/jsx.types.js';
import type {
  ReactComponent,
  StylableComponentConfigOptions,
} from '../../types/styled.types.js';
import { getNormalizeConfig } from '../../utils/config.utils.js';
import { getComponentDisplayName } from '../../utils/react.utils.js';
// import { useTwinDevTools } from '../hooks/useDevTools.js';
// import { useInteractions } from '../hooks/useInteractions.js';
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
    // props = Object.assign({ ref }, props);

    const reactID = useId();

    const injectedProps = props?.['_twinInjected'];
    const id = injectedProps?.id ?? reactID;
    // const { isSelected } = useTwinDevTools(id, props?.['_twinComponentTree']);

    const { componentStyles } = useStyledProps(id, props, configs);
    componentStyles;

    // TODO: RESTORE HANDLERS
    // const { handlers, parentState, state } = useInteractions(
    //   id,
    //   componentStyles.metadata,
    //   props,
    // );

    const newProps = {
      ...props,
      // ...handlers,
    };

    // if (componentStyles.sheets.length > 0) {
    //   for (const style of componentStyles.sheets) {
    //     const oldProps = newProps[style.prop] ? { ...newProps[style.prop] } : {};
    //     newProps[style.prop] = Object.assign(
    //       style.getStyles(
    //         {
    //           // @ts-expect-error
    //           isParentActive: parentState.isGroupActive,
    //           // @ts-expect-error
    //           isPointerActive: state.isLocalActive,
    //           dark: colorScheme.get() === 'dark',
    //         },
    //         // templateEntriesObj[style.prop] ?? [],
    //       ),
    //       oldProps,
    //     );
    //   }
    // }

    // for (const x of configs) {
    //   if (x.target !== x.source) {
    //     if (x.source in newProps) {
    //       Reflect.deleteProperty(newProps, x.source);
    //     }
    //   }
    // }

    // for (const x of twinProps) {
    //   if (x in newProps) {
    //     Reflect.deleteProperty(newProps, x);
    //   }
    // }

    // if (componentStyles.metadata.isGroupParent) {
    //   return createElement(
    //     groupContext.Provider,
    //     {
    //       value: id,
    //     },
    //     createElement(component, { ...newProps, ref }),
    //   );
    // }

    return createElement(component, { ...newProps, ref });
  });
  stylizedComponents.set(Component, TwinComponent);

  if (__DEV__) {
    TwinComponent.displayName = `Twin(${getComponentDisplayName(Component)})`;
  }

  return TwinComponent;
};

export const createStylableComponent = NativeTwinHOC;
