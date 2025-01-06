import type { ExpoJsOutput } from '@expo/metro-config/build/serializer/jsOutput.js';
import { transformPostCssModule } from '@expo/metro-config/build/transform-worker/postcss.js';
import { escapeBackticksAndOctals } from '@native-twin/helpers';
import { pathToHtmlSafeName } from '@native-twin/helpers/server';
import * as CodeBlockWriter from 'code-block-writer';
import worker from 'metro-transform-worker';
// @ts-expect-error untyped
import countLines from 'metro/src/lib/countLines';
import type { NativeTwinTransformerOpts } from '../models/Metro.models.js';

export const transformCSSExpo = async (
  config: NativeTwinTransformerOpts,
  projectRoot: string,
  filename: string,
  data: Buffer | string,
  options: worker.JsTransformOptions,
) => {
  const reactServer = options.customTransformOptions?.['environment'] === 'react-server';

  // eslint-disable-next-line prefer-const
  const code = data.toString('utf-8');

  // Apply postcss transforms
  const postcssResults = await transformPostCssModule(projectRoot, {
    src: code,
    filename,
  });

  const { transform } = require('lightningcss') as typeof import('lightningcss');

  // TODO: Add bundling to resolve imports
  // https://lightningcss.dev/bundling.html#bundling-order

  const cssResults = transform({
    filename,
    code: Buffer.from(code),
    sourceMap: false,
    cssModules: false,
    projectRoot,
    minify: options.minify,
  });

  // TODO: Warnings:
  // cssResults.warnings.forEach((warning) => {
  // });

  const styles = wrapDevelopmentCSS({ src: code, filename, reactServer });
  // console.log('CODE: ', styles);
  // Create a mock JS module that exports an empty object,
  // this ensures Metro dependency graph is correct.
  const jsModuleResults = await worker.transform(
    config,
    projectRoot,
    filename,
    options.dev ? Buffer.from(styles) : Buffer.from(''),
    options,
  );

  const cssCode = cssResults.code.toString();

  // In production, we export the CSS as a string and use a special type to prevent
  // it from being included in the JS bundle. We'll extract the CSS like an asset later
  // and append it to the HTML bundle.
  const output: ExpoJsOutput[] = [
    {
      type: 'js/module',
      data: {
        ...(jsModuleResults.output[0] as ExpoJsOutput).data,
        // Append additional css metadata for static extraction.
        css: {
          code: cssCode,
          lineCount: countLines(cssCode),
          map: [],
          functionMap: null,
          // Disable caching for CSS files when postcss is enabled and has been run on the file.
          // This ensures that things like tailwind can update on every change.
          skipCache: postcssResults.hasPostcss,
        },
      },
    },
  ];

  return {
    dependencies: jsModuleResults.dependencies,
    output,
  };
};

export function getHotReplaceTemplate(id: string) {
  // In dev mode, we need to replace the style tag instead of appending it
  // use the path as the expo-css-hmr attribute to find the style tag
  // to replace.
  const attr = JSON.stringify(pathToHtmlSafeName(id));
  const writer = new CodeBlockWriter.default();
  writer.writeLine(`style.setAttribute('data-expo-css-hmr', ${attr});`);
  writer.writeLine(`style.setAttribute('data-native-twin', "");`);
  writer.writeLine(
    `const previousStyle = document.querySelector('[data-expo-css-hmr=${attr}]');`,
  );

  writer.newLine();

  writer.write('if (previousStyle) ');
  writer.block(() => {
    writer.indent().write('previousStyle.parentNode.removeChild(previousStyle);');
  });

  return writer.toString();
}

const getDomStyleInjector = (filename: string, code: string) => {
  const writer = new CodeBlockWriter.default();
  const withBackTicksEscaped = escapeBackticksAndOctals(code);
  writer.writeLine(
    `const head = document.head || document.getElementsByTagName('head')[0];`,
  );
  writer.writeLine(`const style = document.createElement('style');`);
  writer.writeLine(`${getHotReplaceTemplate(filename)}`);
  writer.writeLine(`style.setAttribute('data-expo-loader', 'css');`);
  writer.writeLine('head.appendChild(style);');
  writer.writeLine(`const css = \`${withBackTicksEscaped}\`;`);

  writer.write('if (style.styleSheet)').space();
  writer.block(() => {
    writer.indent().write('style.styleSheet.cssText = css;');
  });
  writer.space().write('else').space();
  writer
    .block(() => {
      writer.write('style.appendChild(document.createTextNode(css));');
    })
    .newLine();
  return writer.toString();
};

const getServerStylesInjector = (styles: string) => {
  // (()=>{${injectClientStyle}})();`
  const writer = new CodeBlockWriter.default();

  writer.write(`(()=>{${styles}})();`);
  return writer.toString();
};

export const getClientRuntimeInjector = (filename: string, styles: string) => {
  const writer = new CodeBlockWriter.default();
  writer
    .write('(() => ')
    .block(() => {
      writer.write(`if (typeof window === 'undefined') return;`);
      writer.write(styles);
    })
    .write(')();');
  // writer
  //   .write(`(() => `)
  //   .block(() => {
  //     writer
  //       .write(`if (typeof __expo_rsc_inject_module === 'function') `)
  //       .block(() => {
  //         writer
  //           .write(`__expo_rsc_inject_module(`)
  //           .block(() => {
  //             writer.write('id: ').write(JSON.stringify(filename)).write(',');
  //             writer.writeLine('code: ').write(JSON.stringify(styles));
  //           })
  //           .write(');');
  //       })
  //       .write(' else ')
  //       .block(() => {
  //         writer.write(
  //           `throw new Error('RSC SSR CSS injection function is not found (__expo_rsc_inject_module)');`,
  //         );
  //       });
  //   })
  //   .write(')();');
  return writer.toString();
};

export function wrapDevelopmentCSS(props: {
  src: string;
  filename: string;
  reactServer: boolean;
}) {
  const injectClientStyle = getDomStyleInjector(props.filename, props.src);
  // When bundling React Server Components, add an iife which will broadcast the client JS script to the root client bundle.
  // This will ensure the global CSS is available in the browser in development.
  if (props.reactServer) {
    return getServerStylesInjector(injectClientStyle);
  }
  return getClientRuntimeInjector(props.filename, injectClientStyle);
}
