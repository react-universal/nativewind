import type { BuildOptions } from 'esbuild';
import { DTSPluginOpts } from 'esbuild-plugin-d.ts';
import merge from 'lodash.merge';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

function resolveModulePath(path: string) {
  try {
    return require.resolve(path);
  } catch {
    return undefined;
  }
}

export function resolveTSConfig(opts: {
  configPath?: string;
  configName?: string;
  searchPath?: string;
}) {
  let configPath =
    opts.configPath ??
    ts.findConfigFile(
      opts.searchPath ?? process.cwd(),
      ts.sys.fileExists,
      opts.configName,
    );
  if (!configPath) {
    throw new Error('No config file found');
  }

  if (configPath.startsWith('.')) {
    configPath = require.resolve(configPath);
  }

  const config = ts.readConfigFile(configPath, (path) => readFileSync(path, 'utf-8'));

  if (config.config.extends) {
    const parentConfig = resolveTSConfig({
      ...opts,
      configPath:
        resolveModulePath(config.config.extends) ??
        resolve(dirname(configPath), config.config.extends),
    }).config;

    config.config = merge(parentConfig, config.config);
  }

  if (config.error) {
    throw config.error;
  } else {
    return {
      config: config.config,
      configPath,
    };
  }
}

export function getCompilerOptions(opts: {
  tsconfig: any;
  pluginOptions: DTSPluginOpts;
  esbuildOptions: BuildOptions;
}) {
  const compilerOptions = ts.convertCompilerOptionsFromJson(
    opts.tsconfig.compilerOptions,
    process.cwd(),
  ).options;

  compilerOptions.declaration = true;
  compilerOptions.emitDeclarationOnly = true;

  if (!compilerOptions.declarationDir) {
    compilerOptions.declarationDir =
      compilerOptions.declarationDir ??
      opts.esbuildOptions.outdir ??
      compilerOptions.outDir;
  }

  if (compilerOptions.incremental && !compilerOptions.tsBuildInfoFile) {
    const configHash = createHash('sha256')
      .update(
        JSON.stringify({
          compilerOptions,
          __buildContext: opts.pluginOptions?.__buildContext,
        }),
      )
      .digest('hex');

    const cacheDir = resolve(
      require.resolve('esbuild/package.json'),
      '../../.cache/esbuild-plugin-d.ts',
    );

    compilerOptions.tsBuildInfoFile = resolve(
      opts.pluginOptions.buildInfoDir ?? cacheDir,
      `esbuild-plugin-dts-${configHash}.tsbuildinfo`,
    );
  }

  return compilerOptions;
}

export const formatBytes = (bytes: number | string) => {
  if (typeof bytes === 'string' || bytes === 0) return '0 Byte';
  const k = 1024;
  const dm = 3;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
