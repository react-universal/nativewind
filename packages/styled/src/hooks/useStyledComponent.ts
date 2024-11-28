import { useMemo } from 'react';
import { StyleSheet, Touchable } from 'react-native';
import type { AnyStyle } from '@native-twin/css';
import type { StyledComponentProps } from '../types/styled.types.js';
import { useChildren } from './useChildren.js';
import { useComponentInteractions } from './useComponentInteractions.js';
import { useComponentRegistry } from './useComponentRegistry.js';
import { useCssToRN } from './useCssToRN.js';

function useBuildStyledComponent({
  className,
  groupID,
  parentID,
  // @ts-expect-error
  style,
  tw,
  children,
  ...restProps
}: StyledComponentProps) {
  const { stylesheet, componentID } = useCssToRN(className ?? tw ?? '');
  const { component, parentComponent, currentGroupID } = useComponentRegistry({
    componentID,
    groupID,
    isGroupParent: stylesheet.metadata.isGroupParent,
    parentID,
  });

  const { componentInteractionHandlers, focusHandlers } = useComponentInteractions({
    props: restProps as Touchable,
    hasGroupInteractions: stylesheet.metadata.hasGroupEvents,
    hasPointerInteractions: stylesheet.metadata.hasPointerEvents,
    isGroupParent: stylesheet.metadata.isGroupParent,
    id: componentID,
  });

  const componentChilds = useChildren(
    children,
    componentID,
    stylesheet.metadata.isGroupParent ? componentID : currentGroupID,
    stylesheet.getChildStyles,
  );

  const componentStyles = useMemo(() => {
    const styles: AnyStyle = stylesheet.getStyles({
      isParentActive: parentComponent.active || parentComponent.focus || parentComponent.hover,
      isPointerActive:
        component.interactionState.active ||
        component.interactionState.focus ||
        component.interactionState.hover,
    });
    return StyleSheet.create({
      generated: {
        ...styles,
        ...style,
      },
    }).generated;
  }, [component.interactionState, stylesheet, parentComponent, style]);

  return {
    componentInteractionHandlers,
    focusHandlers,
    componentStyles,
    componentChilds,
    currentGroupID,
  };
}

export { useBuildStyledComponent };
