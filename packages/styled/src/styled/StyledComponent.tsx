import {
  forwardRef,
  createElement,
  type ComponentType,
  type Ref,
  type ForwardRefExoticComponent,
  useMemo,
} from 'react';
import { StyleSheet, type StyleProp, type Touchable } from 'react-native';
import type { AnyStyle } from '@native-twin/css';
import { useChildren } from '../hooks/useChildren.js';
import { useComponentInteractions } from '../hooks/useComponentInteractions.js';
import { useComponentRegistry } from '../hooks/useComponentRegistry.js';
import { useCssToRN } from '../hooks/useCssToRN.js';
import type { StyledComponentProps } from '../types/styled.types.js';
import { getComponentDisplayName } from '../utils/getComponentDisplayName.js';

export type { StyledComponentProps };
export { useCssToRN, useComponentRegistry, useComponentInteractions };

function styledComponentsFactory<
  StyleType,
  InitialProps extends { style?: StyleProp<StyleType> },
  Props extends InitialProps = InitialProps,
>(
  Component: ComponentType<InitialProps>,
  styledProp = 'style',
): ForwardRefExoticComponent<Props & StyledComponentProps & { ref?: Ref<any> }> {
  const ForwardRefComponent = forwardRef((props: any, ref) => {
    const classNames = props.className ?? props.tw ?? '';
    const { stylesheet, componentID } = useCssToRN(classNames);

    const { component, parentComponent, currentGroupID } = useComponentRegistry({
      componentID,
      groupID: props.groupID,
      isGroupParent: stylesheet.metadata.isGroupParent,
      parentID: props.parentID,
    });

    const { componentInteractionHandlers, focusHandlers } = useComponentInteractions({
      props: props as Touchable,
      hasGroupInteractions: stylesheet.metadata.hasGroupEvents,
      hasPointerInteractions: stylesheet.metadata.hasPointerEvents,
      isGroupParent: stylesheet.metadata.isGroupParent,
      id: componentID,
    });

    const componentChilds = useChildren(
      props.children,
      componentID,
      stylesheet.metadata.isGroupParent ? componentID : currentGroupID,
      stylesheet.getChildStyles,
    );

    const componentStyles = useMemo(() => {
      const styles: AnyStyle = stylesheet.getStyles({
        isParentActive:
          parentComponent.active || parentComponent.focus || parentComponent.hover,
        isPointerActive:
          component.interactionState.active ||
          component.interactionState.focus ||
          component.interactionState.hover,
      });
      return StyleSheet.create({
        generated: {
          ...styles,
          ...(props?.style as unknown as AnyStyle),
        },
      }).generated;
    }, [component.interactionState, stylesheet, parentComponent, props.style]);

    // const start = performance.now();
    const newProps = {
      ...props,
    };
    Reflect.deleteProperty(newProps, 'className');
    Reflect.deleteProperty(newProps, 'tw');
    // console.log('TOOK: ', performance.now() - start);
    return createElement(Component, {
      ...newProps,
      [styledProp]: componentStyles,
      ref,
      children: componentChilds,
      groupID: currentGroupID,
      ...focusHandlers,
      ...componentInteractionHandlers,
    });
  });
  if (__DEV__) {
    ForwardRefComponent.displayName = `Styled(${getComponentDisplayName(Component)})`;
  }
  return ForwardRefComponent as ForwardRefExoticComponent<
    Props & StyledComponentProps & { ref?: Ref<any> }
  >;
}

export default styledComponentsFactory;

export function invokeComponent<T>(Component: ComponentType<T>, props: T) {
  // @ts-expect-error
  return <Component {...props} />;
}

// styledComponent.variants = <TConfig,>(config?: VariantsConfig<TConfig>) => {
//   const classNamesGenerator = createVariants(config!);
//   const ComponentWithVariants = styledComponent();

//   // We need to limit the props control to only Result https://www.typescriptlang.org/play?#code/GYVwdgxgLglg9mABBATgUwIZTQUQB7ZgAmaRAwnALYAOAPAAopzUDOAfABQU0BciH1Jqz6NmLAJSIAvG0QYwAT0kBvAFCJkCFlET5CJYt2rT+gsSKETpstRo3ooIFEiMDL49YgC+nvWmL+5FTUAHRYUCgsJrQASmgsIAA2OmgEgVH0GCiwGIkMlmyc4ZF8cQnJkjKItnYQWjqMaHVgwDAA5k5YpEYmbua6eBCJICT5YgA0iGVJUGyVNp52iA5OLsEcyiFbZqyTW2FQESxeHks+SyvOiI3NrR0oXUE0nufLaI5XfgGGwao+qqBILAEIgen1hNVENhtHxtCgYGA2pNtApEmhYREEW1vCpPJckDsWH9VM1tNd0Ld2j0pMh0F0viQntQuMFxAcjhsofEoHwAORwADWvJxqhuCDurmUiBRaL50KgwpOQA
//   const ForwardRefComponent = forwardRef<
//     any,
//     VariantProps<typeof classNamesGenerator> & StyledComponentProps & Props
//   >((props, ref) => {
//     return <ComponentWithVariants ref={ref} {...(props as Props)} />;
//   });
//   if (__DEV__) {
//     ForwardRefComponent.displayName = `Styled(${getComponentDisplayName(Component)})`;
//   }
//   return ForwardRefComponent;
// };
