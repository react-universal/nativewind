import type { AnyStyle } from '@native-twin/css';
import { Children, type ReactNode, cloneElement, isValidElement, useMemo } from 'react';
import { isFragment } from 'react-is';
import { type StyleProp, StyleSheet } from 'react-native';

function useChildren(
  componentChildren: ReactNode,
  componentID: string,
  groupID: string,
  getChildStyles: (input: {
    isFirstChild: boolean;
    isLastChild: boolean;
    isEven: boolean;
    isOdd: boolean;
  }) => AnyStyle,
) {
  const children = isFragment(componentChildren)
    ? componentChildren.props.children
    : componentChildren;
  return useMemo(() => {
    if (!children) {
      return undefined;
    }
    const totalChilds = Children.count(children);
    if (totalChilds === 1) {
      if (!isValidElement<{ style?: StyleProp<unknown> }>(children)) {
        return children;
      } else {
        return cloneElement(children, {
          parentID: componentID,
          groupID,
        } as Record<string, unknown>);
      }
    }
    return Children.toArray(children)
      .filter(Boolean)
      .flatMap((child, index) => {
        if (!isValidElement<{ style?: StyleProp<unknown> }>(child)) {
          return child;
        }

        const style = getChildStyles({
          isEven: (index + 1) % 2 === 0,
          isOdd: (index + 1) % 2 !== 0,
          isFirstChild: index === 0,
          isLastChild: index + 1 === totalChilds,
        });

        if (!style || Object.keys(style).length === 0) {
          return cloneElement(child, {
            parentID: componentID,
            groupID,
          } as Record<string, unknown>);
        }
        if (child.props.style) {
          return cloneElement(child, {
            style: StyleSheet.flatten([child.props.style, style]),
            parentID: componentID,
            groupID: groupID,
          } as Record<string, unknown>);
        }
        return cloneElement(child, {
          style: StyleSheet.flatten(style),
          parentID: componentID,
          groupID: groupID,
        } as Record<string, unknown>);
      });
  }, [children, getChildStyles, groupID, componentID]);
}

export { useChildren };
