/* eslint-env node */
import React from 'react';
import type { DocumentContext, DocumentInitialProps } from 'next/document';
import Document from 'next/document';
import { extract } from '@native-twin/core';

// import { createStylableComponent } from '@native-twin/jsx';

// TODO: Check this on every react web fmw
// const RN = require('react-native');;

// RN.Image = createStylableComponent(RN.Image, { className: 'style' });
// RN.Pressable = createStylableComponent(RN.Pressable, { className: 'style' });
// RN.SafeAreaView = createStylableComponent(RN.SafeAreaView, { className: 'style' });
// RN.Switch = createStylableComponent(RN.Switch, { className: 'style' });
// RN.Text = createStylableComponent(RN.Text, { className: 'style' });
// RN.TouchableHighlight = createStylableComponent(RN.TouchableHighlight, {
//   className: 'style',
// });
// RN.TouchableOpacity = createStylableComponent(RN.TouchableOpacity, {
//   className: 'style',
// });
// RN.TouchableWithoutFeedback = createStylableComponent(RN.TouchableWithoutFeedback, {
//   className: 'style',
// });
// RN.View = createStylableComponent(RN.View, { className: 'style' });
// RN.ActivityIndicator = createStylableComponent(RN.ActivityIndicator, {
//   className: { target: 'style', nativeStyleToProp: { color: true } },
// });
// RN.StatusBar = createStylableComponent(RN.StatusBar, {
//   className: { target: false, nativeStyleToProp: { backgroundColor: true } },
// });
// RN.ScrollView = createStylableComponent(RN.ScrollView, {
//   className: 'style',
//   contentContainerClassName: 'contentContainerStyle',
//   indicatorClassName: 'indicatorStyle',
// });
// RN.TextInput = createStylableComponent(RN.TextInput, {
//   className: { target: 'style', nativeStyleToProp: { textAlign: true } },
// });

export { installDocument };

function installDocument(): typeof Document;
function installDocument<Component extends typeof Document = typeof Document>(
  DocumentComponent: Component,
): Component;

function installDocument<Component extends typeof Document = typeof Document>(
  BaseComponent: Component = Document as Component,
): Component {
  // @ts-expect-error
  return class NativeTailwindDocument extends BaseComponent {
    // @ts-expect-error
    static async getInitialProps(
      ctx: DocumentContext & {
        defaultGetInitialProps: (
          ctx: DocumentContext,
          options?: { nonce?: string },
        ) => Promise<DocumentInitialProps>;
      },
    ) {
      const defaultGetInitialProps = ctx.defaultGetInitialProps.bind(ctx);

      ctx.defaultGetInitialProps = async (ctx, options: { nonce?: string } = {}) => {
        const props = await defaultGetInitialProps(ctx, options);

        const { html, css } = extract(props.html);

        const styles = React.createElement(
          React.Fragment,
          null,
          React.createElement('style', {
            'data-native-twin': '',
            nonce: options.nonce,
            dangerouslySetInnerHTML: {
              __html: css,
            },
          }),
          props.styles,
        );

        return { ...props, html, styles };
      };

      return BaseComponent.getInitialProps(ctx);
    }
  };
}
