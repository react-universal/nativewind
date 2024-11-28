import { forwardRef, type ComponentType } from 'react';
import type { StyleProp } from 'react-native';
import { cx } from '@native-twin/core';
import type { StyledComponentProps } from '../types/styled.types.js';
import { getComponentDisplayName } from '../utils/getComponentDisplayName.js';

function styledComponentsFactory<
  StyleType,
  InitialProps extends { style?: StyleProp<StyleType> },
  Props extends InitialProps = InitialProps,
>(Component: ComponentType<InitialProps>) {
  const ForwardRefComponent = forwardRef<any, Props>(
    (props: Props & StyledComponentProps, ref) => {
      const classNames = cx(props.className ?? props.tw);
      return (
        <Component
          {...props}
          style={[
            {
              $$css: true,
              [classNames]: classNames,
            },
            props.style,
          ]}
          ref={ref}
        />
      );
    },
  );
  if (__DEV__) {
    ForwardRefComponent.displayName = `Styled(${getComponentDisplayName(Component)})`;
  }
  return ForwardRefComponent as any;
}

export default styledComponentsFactory;

export function invokeComponent<T>(Component: ComponentType<T>, props: T) {
  // @ts-expect-error
  return <Component {...props} />;
}
