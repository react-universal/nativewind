import * as fs from 'node:fs';
import type { ExpoJsOutput } from '@expo/metro-config/build/serializer/jsOutput';
import { TwinNodeContext } from '@native-twin/compiler';
import { countLines, pathToHtmlSafeName } from '@native-twin/helpers/server';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as worker from 'metro-transform-worker';
import { MetroWorkerService } from '../services/MetroWorker.service.js';

export const transformCSS = Effect.gen(function* () {
  const { input } = yield* MetroWorkerService;
  const twin = yield* TwinNodeContext;
  const platform = input.options.platform ?? 'native';
  const outputPath = twin.getOutputCSSPath('web');

  if (platform !== 'web') {
    return Option.none() as Option.Option<worker.TransformResponse>;
  }

  const { transform: lightningcssTransform } =
    require('lightningcss') as typeof import('lightningcss');

  // const files = yield* twinFS.getAllFiles;
  // yield* twinFS.runTwinForFiles(files, platform);

  const output = fs.readFileSync(outputPath, 'utf-8');
  // const twinCSS = sheetEntriesToCss(twin.sheetTarget, true);

  if (output.length === 0) {
    return Option.none();
  }

  const cssResult = lightningcssTransform({
    code: Buffer.from(output),
    filename: outputPath,
    cssModules: false,
    minify: false,
  });

  const jsModuleResults = yield* Effect.promise(() => {
    return worker.transform(
      input.config,
      input.projectRoot,
      input.filename,
      input.options.dev
        ? Buffer.from(
            wrapDevelopmentCSS({
              src: input.data.toString('utf-8'),
              filename: input.filename,
              reactServer:
                // biome-ignore lint/complexity/useLiteralKeys: <explanation>
                input.options.customTransformOptions?.['environment'] === 'react-server',
            }),
          )
        : Buffer.from(''),
      input.options,
    );
  });

  // console.log('jsModuleResults: ', inspect(jsModuleResults, false, null, true));

  const cssCode = cssResult.code.toString();

  // yield* Console.log('CSS_CODE: ', cssCode);

  const outputCode: ExpoJsOutput[] = [
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
          skipCache: false,
        },
      },
    },
  ];

  return Option.some({
    dependencies: jsModuleResults.dependencies,
    output: outputCode,
  }) as Option.Option<worker.TransformResponse>;
});

export function wrapDevelopmentCSS(props: {
  src: string;
  filename: string;
  reactServer: boolean;
}) {
  const withBackTicksEscaped = escapeBackticksAndOctals(props.src);

  const injectClientStyle = `const head = document.head || document.getElementsByTagName('head')[0];
const style = document.createElement('style');
${getHotReplaceTemplate(props.filename)}
style.setAttribute('data-expo-loader', 'css');
style.setAttribute('data-native-twin', '');
head.appendChild(style);
const css = \`${withBackTicksEscaped}\`;
if (style.styleSheet){
  style.styleSheet.cssText = css;
} else {
  style.appendChild(document.createTextNode(css));
}
`;

  // When bundling React Server Components, add an iife which will broadcast the client JS script to the root client bundle.
  // This will ensure the global CSS is available in the browser in development.
  if (props.reactServer) {
    const injectStyle = `
    (()=>{${injectClientStyle}})();`;
    return injectStyle;
  }

  const injectStyle = `(() => {
if (typeof window === 'undefined') {
  return
}
  
${injectClientStyle}
})();`;

  return injectStyle;
}

function getHotReplaceTemplate(id: string) {
  // In dev mode, we need to replace the style tag instead of appending it
  // use the path as the expo-css-hmr attribute to find the style tag
  // to replace.
  const attr = JSON.stringify(pathToHtmlSafeName(id));
  return `style.setAttribute('data-expo-css-hmr', ${attr});
  style.setAttribute('data-native-twin', "");
  const previousStyle = document.querySelector('[data-expo-css-hmr=${attr}]');
  if (previousStyle) {
    console.log(\`Style Fast Refresh: \${Date.now()-${Date.now()}}ms\`)
    previousStyle.parentNode.removeChild(previousStyle);
  }`;
}

function escapeBackticksAndOctals(str: string) {
  if (typeof str !== 'string') {
    return '';
  }

  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    // biome-ignore lint/suspicious/noControlCharactersInRegex: <explanation>
    .replace(/[\0-\x07]/g, (match) => `\\0${match.charCodeAt(0).toString(8)}`);
}
