import {
  traverse,
  NodePath,
  parseSync,
  types as t,
  transformFromAstAsync,
} from '@babel/core';
// import generate from '@babel/generator';
// import t from '@babel/types';
import { useRna } from '@chialab/esbuild-rna';
import esbuild from 'esbuild';
import path from 'path';

/**
 * A file loader plugin for esbuild for `require.resolve` statements.
 * @returns An esbuild plugin.
 */
export function requireResolvePlugin() {
  const plugin: esbuild.Plugin = {
    name: 'require-resolve',
    async setup(pluginBuild) {
      const manager = useRna(plugin, pluginBuild);
      const { sourcemap } = manager.getOptions();
      const workingDir = manager.getWorkingDir();
      manager.onTransform({ loaders: ['ts', 'tsx', 'js', 'jsx'] }, async (args) => {
        if (!args.code.includes('require.resolve')) {
          return;
        }

        const sourceFileName = path.relative(workingDir, args.path);
        const ast = parseSync(args.code, {
          plugins: ['typescript', 'jsx'],
          sourceType: 'module',
          // errorRecovery: true,
          // allowImportExportEverywhere: true,
          generatorOpts: {
            // strictMode: false,
            sourceFileName,
          },
        });
        if (!ast) return;
        const requireResolvePaths: NodePath<t.CallExpression>[] = [];

        traverse(ast, {
          CallExpression(nodePath) {
            const { node } = nodePath;
            if (
              node.callee.type !== 'MemberExpression' ||
              node.callee.object.type !== 'Identifier' ||
              node.callee.object.name !== 'require' ||
              node.callee.property.type !== 'Identifier' ||
              node.callee.property.name !== 'resolve'
            ) {
              return;
            }

            const argument = node.arguments[0];
            if (argument?.type !== 'StringLiteral') {
              return;
            }
            requireResolvePaths.push(nodePath);
          },
        });

        if (requireResolvePaths.length === 0) {
          return;
        }

        for await (const requireResolve of requireResolvePaths) {
          const argument = requireResolve.node.arguments[0];

          if (!argument || argument?.type !== 'StringLiteral') continue;

          const argumentPath = requireResolve
            .get('arguments')
            .find((x) => x.node === argument);

          if (!argumentPath) continue;

          const fileName = argument.value;
          const { path: resolvedFilePath } = await manager.resolve(fileName, {
            kind: 'require-resolve',
            importer: args.path,
            resolveDir: path.dirname(args.path),
          });

          if (!resolvedFilePath) continue;

          const options = manager.getOptions();
          const contents = await manager.emitBuild(
            {
              ...options,
              entryNames: resolvedFilePath,
              entryPoints: [resolvedFilePath],
              format: options.format,
              write: false,
            },
            true,
          );
          // if (!contents.outputFiles) {
          //   esbuild.analyzeMetafile(contents.metafile);
          //   continue;
          // }

          const emittedFile = Object.keys(contents.metafile.outputs).find((x) =>
            x.endsWith('js'),
          );
          // console.log('____EMITTED_FILE____: ', emittedFile);

          // const metafileInfo = await esbuild.analyzeMetafile(contents.metafile);
          if (!emittedFile) {
            // console.log('NO_EMITED_WITH_META: ', contents.metafile);
            continue;
          }
          // console.log('REQUIRE_RESOLVE_BUILD_CONTENTS: ', metafileInfo);

          // const emittedFile = await manager.emitFile(resolvedFilePath);
          // console.log('RESOLVE_FILE_PATH: ', resolvedFilePath);
          // console.log('EMITTED_FILE: ', emittedFile);
          const outputFile = manager.resolveRelativePath(emittedFile);
          // console.log('_______OUT_FILE_______: ', outputFile);

          argumentPath.replaceWith(t.stringLiteral(outputFile));
          requireResolve.scope.crawl();
        }

        const result = await transformFromAstAsync(ast, args.code, {
          sourceMaps: !!sourcemap,
          sourceFileName: sourceFileName,
          ast: false,
          generatorOpts: {
            sourceMaps: !!sourcemap,
            filename: sourceFileName,
            sourceFileName: sourceFileName,
            retainLines: true,
          },
        });

        if (!result?.code) {
          return;
        }

        return {
          code: result.code,
          map: result.map,
        };
        // // @ts-expect-error Not know why this is required in here
        // return generate.default(
        //   ast,
        //   {
        // sourceMaps: !!sourcemap,
        // filename: sourceFilename,
        // sourceFileName: sourceFilename,
        //   },
        //   args.code,
        // );
      });
    },
  };

  return plugin;
}
