import tsPlugin from '@rollup/plugin-typescript';
import * as RA from 'effect/Array';
import { pipe } from 'effect/Function';
import * as Record from 'effect/Record';
import * as Tuple from 'effect/Tuple';
import glob from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import * as rollup from 'rollup';
import preserveDirectives from 'rollup-plugin-preserve-directives';

const testPatterns = ['**/*.spec.ts', '**/*.test.ts'];

export interface RollupBuildOptions {
  format: 'esm' | 'cjs';
  extension: 'js' | 'cjs' | 'mjs';
  outDir: string;
  sourcemap: boolean;
}

const rollupSharedOptions: rollup.RollupOptions = {
  treeshake: true,
  perf: true,
  jsx: 'preserve',
  logLevel: 'debug',
  shimMissingExports: true,
  external: (id, _, isResolved) => {
    if (!isResolved) {
      return true;
    }
    if (path.isAbsolute(id)) return true;
    if (id.startsWith('.')) {
      return true;
    }
    return false;
  },
  onLog(level, log, defaultHandler) {
    if (level === 'warn' && log.code === 'EMPTY_BUNDLE') {
      return undefined;
    }
    return defaultHandler(level, log);
  },
};

export const rollupDefaultConfigs: RollupBuildOptions[] = [
  {
    extension: 'js',
    format: 'cjs',
    outDir: 'build',
    sourcemap: true,
  },
  {
    extension: 'js',
    format: 'esm',
    outDir: 'build/esm',
    sourcemap: true,
  },
];

export const createRollupConfig = (
  configs: RollupBuildOptions[],
  plugins: rollup.Plugin[],
) => {
  const entrypoints = getBuilderEntryPoints();

  const rollupOptions = configs.map(
    ({ format, outDir, sourcemap }): rollup.RollupOptions => {
      return {
        ...rollupSharedOptions,
        input: entrypoints,
        plugins: [
          plugins,
          preserveDirectives({ exclude: ['**/*.tsx'] }),
          tsPlugin({
            exclude: [...testPatterns],
            tsconfig: 'tsconfig.build.json',
            compilerOptions: {
              sourceMap: true,
              declarationDir: outDir,
              declarationMap: true,
              removeComments: false,
              declaration: true,
              outDir: outDir,
            },
          }),
        ],
        output: {
          format,
          dir: outDir,
          // Using preserveModules disables bundling and the creation of chunks,
          // leading to a result that is a mirror of the input module graph.
          preserveModules: true,
          esModule: 'if-default-prop',
          interop: 'compat',
          sourcemap,
          generatedCode: 'es5',
          // Hoisting transitive imports adds bare imports in modules,
          // which can make imports by JS runtimes slightly faster,
          // but makes the generated code harder to follow.
          hoistTransitiveImports: false,
          preserveModulesRoot: 'src',
        },
      };
    },
  );

  return rollup.defineConfig(rollupOptions);
};

const getRelativePath = (file: string) =>
  path.relative('src', file.slice(0, file.length - path.extname(file).length));

const getBuilderEntryPoints = () => {
  return pipe(
    glob.sync('./src/**/!(*.d).{ts,tsx}'),
    RA.map((file) => Tuple.make(getRelativePath(file), path.join('./', file))),
    Record.fromEntries,
  );
};

export function clearDir(dir: string): void {
  const dirPath = path.join(process.cwd(), dir);
  if (dir && fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`cleared: ${dir}`);
  }
}
