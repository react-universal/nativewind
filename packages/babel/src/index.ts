import type { PluginObj } from '@babel/core';
import { addNamed } from '@babel/helper-module-imports';
import {
  BABEL_JSX_PLUGIN_IMPORT_RUNTIME,
  type BabelAPI,
  BabelCompilerContext,
  BabelCompilerContextLive,
  CompilerConfigContext,
  JSXImportPluginContext,
  type TwinBabelPluginOptions,
  TwinNodeContextLive,
  createCompilerConfig,
} from '@native-twin/compiler';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

const NodeMainLayerSync = Layer.empty.pipe(
  Layer.provideMerge(BabelCompilerContextLive),
  Layer.provideMerge(TwinNodeContextLive),
);

const allowed = new Set<string>();
const program = Effect.scoped(
  Effect.gen(function* () {
    const ctx = yield* JSXImportPluginContext;
    const reactCompiler = yield* BabelCompilerContext;
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

function nativeTwinBabelPlugin(
  _: BabelAPI,
  options: TwinBabelPluginOptions,
  cwd: string,
): PluginObj {
  return program.pipe(
    Effect.provide(JSXImportPluginContext.make(options, cwd)),
    Effect.provide(NodeMainLayerSync),
    Effect.provide(
      Layer.succeed(
        CompilerConfigContext,
        createCompilerConfig({
          outDir: options.outputDir ?? '.',
          rootDir: cwd,
          inputCSS: options.inputCSS,
          twinConfigPath: options.twinConfigPath,
        }),
      ),
    ),
    Effect.runSync,
  );
}

export default nativeTwinBabelPlugin;
