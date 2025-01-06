import { type ComponentType, forwardRef } from 'react';
import { Platform, type TextProps } from 'react-native';
import Text from './Text.primitive.js';

function createHeadingComponent(level: number): ComponentType<TextProps> {
  const nativeProps: any = Platform.select({
    web: {
      'aria-level': level,
    },
    default: {},
  });
  const Element = forwardRef((props: TextProps, ref) => {
    return <Text {...nativeProps} role='heading' {...props} ref={ref} />;
  }) as ComponentType<TextProps>;

  Element.displayName = `H${level}`;

  return Element;
}

const PrimitiveH1 = createHeadingComponent(1);
const PrimitiveH2 = createHeadingComponent(2);
const PrimitiveH3 = createHeadingComponent(3);
const PrimitiveH4 = createHeadingComponent(4);
const PrimitiveH5 = createHeadingComponent(5);
const PrimitiveH6 = createHeadingComponent(6);

export { PrimitiveH1, PrimitiveH2, PrimitiveH3, PrimitiveH4, PrimitiveH5, PrimitiveH6 };
