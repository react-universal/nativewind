import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

export type AnyStyle = ImageStyle | TextStyle | ViewStyle;

export interface CompleteStyle
  extends ViewStyle,
    TextStyle,
    Omit<ImageStyle, 'overflow'> {}

// export interface ParserRuntimeContext {
//   rem: number;
//   deviceHeight: number;
//   deviceWidth: number;
// }

// export type FinalSheet = Record<SelectorGroup, CompleteStyle>;
