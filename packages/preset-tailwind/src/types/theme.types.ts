import type { ThemeAnimation, __Theme__ } from '@native-twin/core';

export interface TailwindPresetTheme extends __Theme__ {
  opacity?: Record<string, string>;
  objectFit?: Record<string, string>;
  resizeMode?: Record<string, string>;
  position?: Record<string, string>;
  alignItems?: Record<string, string>;
  alignContent?: Record<string, string>;
  borderStyle?: Record<string, string>;
  backfaceVisibility?: Record<string, string>;
  fontStyle?: Record<string, string>;
  width?: Record<string, string>;
  height?: Record<string, string>;
  maxWidth?: Record<string, string>;
  flexBasis?: Record<string, string>;
  flexGrow?: Record<string, string>;
  textDecorationLine?: Record<string, string>;
  maxHeight?: Record<string, string>;
  minWidth?: Record<string, string>;
  minHeight?: Record<string, string>;
  inlineSize?: Record<string, string>;
  blockSize?: Record<string, string>;
  verticalAlign?: Record<string, string>;
  textAlign?: Record<string, string>;
  flex?: Record<string, string>;
  flexDirection?: Record<string, string>;
  flexWrap?: Record<string, string>;
  justifyContent?: Record<string, string>;
  overflow?: Record<string, string>;
  aspectRatio?: Record<string, string>;
  maxInlineSize?: Record<string, string>;
  maxBlockSize?: Record<string, string>;
  minInlineSize?: Record<string, string>;
  minBlockSize?: Record<string, string>;
  borderRadius?: Record<string, string>;
  textDecorationStyle?: Record<string, string>;
  textTransform?: Record<string, string>;
  borderWidth?: Record<string, string>;
  verticalBreakpoints?: Record<string, string | number>;
  fontFamily?: Record<string, string>;
  fontSize?: Record<string, string> | undefined;
  fontWeight?: Record<string, string>;
  lineHeight?: Record<string, string>;
  letterSpacing?: Record<string, string>;
  wordSpacing?: Record<string, string>;
  boxShadow?: Record<string, Record<string, any>>;
  textIndent?: Record<string, string> | undefined;
  textShadow?: Record<string, string | string[]> | undefined;
  textStrokeWidth?: Record<string, string> | undefined;
  ringWidth?: Record<string, string> | undefined;
  lineWidth?: Record<string, string> | undefined;
  spacing?: Record<string, string> | undefined;
  translate?: Record<string, string> | undefined;
  rotate?: Record<string, string> | undefined;
  scale?: Record<string, string> | undefined;
  skew?: Record<string, string> | undefined;
  aria?: Record<string, string> | undefined;
  data?: Record<string, string> | undefined;
  // filters
  blur?: Record<string, string>;
  dropShadow?: Record<string, string | string[]>;
  // transitions
  easing?: Record<string, string>;
  // media queries
  media?: Record<string, string>;
  // supports queries
  supports?: Record<string, string>;
  // container queries
  containers?: Record<string, string>;
  // animation
  animation?: ThemeAnimation;
  // grids
  gridAutoColumn?: Record<string, string>;
  gridAutoRow?: Record<string, string>;
  gridColumn?: Record<string, string>;
  gridRow?: Record<string, string>;
  gridTemplateColumn?: Record<string, string>;
  gridTemplateRow?: Record<string, string>;
  // container
  zIndex?: Record<string, string>;
  container?: {
    center?: boolean;
    padding?: string | Record<string, string>;
    maxWidth?: Record<string, string>;
  };
  // vars
  // animations
  duration?: Record<string, string>;
  transition?: Record<string, Record<string, string>>;
}
