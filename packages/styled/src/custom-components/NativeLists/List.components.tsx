import {
  FlatList,
  type FlatListProps,
  SectionList,
  type SectionListProps,
  type ViewStyle,
  VirtualizedList,
  type VirtualizedListProps,
} from 'react-native';
import createStyledComponent, { invokeComponent } from '../../styled/StyledComponent.js';
import type { StyledComponentProps } from '../../types/styled.types.js';

export function styledFlatList<Type>(props: StyledComponentProps & FlatListProps<Type>) {
  return invokeComponent(
    createStyledComponent<ViewStyle, FlatListProps<Type>>(
      FlatList,
      'contentContainerStyle',
    ),
    props,
  );
}
export function styledSectionList<Type>(
  props: StyledComponentProps & SectionListProps<Type>,
) {
  return invokeComponent(
    createStyledComponent<ViewStyle, SectionListProps<Type>>(
      SectionList,
      'contentContainerStyle',
    ),
    props,
  );
}

export function styledVirtualizedList<Type>(
  props: StyledComponentProps & VirtualizedListProps<Type>,
) {
  return invokeComponent(
    createStyledComponent<ViewStyle, VirtualizedListProps<Type>>(
      VirtualizedList,
      'contentContainerStyle',
    ),
    props,
  );
}
