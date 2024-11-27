import type { PluginObj } from '@babel/core';
import { addNamed } from '@babel/helper-module-imports';
import * as Effect from 'effect/Effect';
import {
  JSXImportPluginContext,
  type TwinBabelPluginOptions,
  type BabelAPI,
  BABEL_JSX_PLUGIN_IMPORT_RUNTIME,
  NodeMainLayer,
} from '@native-twin/compiler/node';
import { makeNodeLayer } from '@native-twin/compiler/node';
import { BabelCompiler } from '@native-twin/compiler/node';

const allowed = new Set<string>();
const program = Effect.scoped(
  Effect.gen(function* () {
    const ctx = yield* JSXImportPluginContext;
    const reactCompiler = yield* BabelCompiler;
    return {
      name: '@native-twin/babel-plugin',
      manipulateOptions(opts, parserOpts) {
        if (ctx.isValidFile(opts.filename)) {
          console.log('\n\n');
          console.log('parser_options: ', parserOpts);
          if (opts.plugins) {
            (opts.plugins as (PluginObj & { key: string; options: object })[])
              .flatMap((x) => {
                if (x.options && Object.keys(x.options).length > 0) {
                  return [
                    {
                      name: x.key,
                      options: x.options,
                    },
                  ];
                }
                return [];
              })
              .forEach((x) => {
                console.log(x);
              });
          }
        }
      },
      visitor: {
        MemberExpression(path, state) {
          if (!state.filename || !ctx.isValidFile(state.filename)) return;
          if (!allowed.has(state.filename)) {
            allowed.add(state.filename);
          }
          console.log('code: ', state.file.code);
          if (reactCompiler.memberExpressionIsReactImport(path)) {
            path.replaceWith(addNamed(path, ...BABEL_JSX_PLUGIN_IMPORT_RUNTIME));
          }
        },
        Identifier(path, state) {
          if (!state.filename || !ctx.isValidFile(state.filename)) return;
          if (!allowed.has(state.filename)) {
            allowed.add(state.filename);
          }
          if (reactCompiler.identifierIsReactImport(path)) {
            path.replaceWith(addNamed(path, ...BABEL_JSX_PLUGIN_IMPORT_RUNTIME));
          }
        },
      },
    } as PluginObj;
  }),
);

// const layer = Logger.replace(Logger.defaultLogger, BabelLogger);

function nativeTwinBabelPlugin(
  _: BabelAPI,
  options: TwinBabelPluginOptions,
  cwd: string,
): PluginObj {
  // console.log('BABEL_OPT: ', options);
  const MainLayer = makeNodeLayer({
    configPath: options.twinConfigPath,
    debug: true,
    inputCSS: options.inputCSS,
    outputDir: options.outputDir,
    projectRoot: cwd,
  });
  return program.pipe(
    // Logger.withMinimumLogLevel(LogLevel.All),
    // Effect.provide(layer),
    Effect.provide(JSXImportPluginContext.make(options, cwd)),
    Effect.provide(NodeMainLayer),
    Effect.provide(MainLayer),
    Effect.runSync,
  );
}

export default nativeTwinBabelPlugin;
