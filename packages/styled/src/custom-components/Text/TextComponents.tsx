import { type ComponentType, forwardRef, type ReactHTML } from 'react';
import { Platform, type TextProps } from 'react-native';
import Text from './Text.primitive.js';

function createTextComponent(tag: keyof ReactHTML): ComponentType<TextProps> {
  const nativeProps: any = Platform.select({
    web: {
      role: 'text',
    },
    default: {},
  });

  const Element = forwardRef((props: TextProps, ref) => {
    return <Text {...nativeProps} {...props} ref={ref} />;
  }) as ComponentType<TextProps>;

  Element.displayName = tag.toLocaleUpperCase();

  return Element;
}

const PrimitiveSpan = createTextComponent('span');
const PrimitiveP = createTextComponent('p');
const PrimitiveStrong = createTextComponent('strong');
const PrimitiveCode = createTextComponent('code');

export { PrimitiveP, PrimitiveSpan, PrimitiveCode, PrimitiveStrong };
