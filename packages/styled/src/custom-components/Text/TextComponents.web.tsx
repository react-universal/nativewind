import { type ComponentType, type ReactHTML, forwardRef } from 'react';
import { Platform, type TextProps } from 'react-native';
// @ts-expect-error
import { unstable_createElement } from 'react-native-web';

function createTextComponent(tag: keyof ReactHTML): ComponentType<TextProps> {
  const nativeProps: any = Platform.select({
    web: {
      role: 'text',
    },
    default: {},
  });

  const Element = forwardRef((props: TextProps, ref) => {
    return unstable_createElement(tag, {
      ...nativeProps,
      ...props,
      ref,
    });
  }) as ComponentType<TextProps>;

  Element.displayName = tag.toLocaleUpperCase();

  return Element;
}

const PrimitiveSpan = createTextComponent('span');
const PrimitiveP = createTextComponent('p');
const PrimitiveStrong = createTextComponent('strong');
const PrimitiveCode = createTextComponent('code');

export { PrimitiveP, PrimitiveSpan, PrimitiveCode, PrimitiveStrong };
