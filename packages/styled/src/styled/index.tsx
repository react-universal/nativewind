import React from 'react';
import * as RN from 'react-native';
import styledComponentsFactory from './StyledComponent.js';

const styled = <StyleType, InitialProps extends { style?: RN.StyleProp<StyleType> }>(
  Component: React.ComponentType<InitialProps>,
) => styledComponentsFactory<StyleType, InitialProps>(Component);

export { styled };
export { styledComponentsFactory as createStyledComponent };
