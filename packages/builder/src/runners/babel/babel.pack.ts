import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import { FileSystem } from '@effect/platform/FileSystem';
import { Path } from '@effect/platform/Path';
import * as Array from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Order from 'effect/Order';
import * as Record from 'effect/Record';
import * as String from 'effect/String';
import { FsUtils, FsUtilsLive } from '../../utils/fs.utils.js';
import type { PackageJson } from './Package.service.js';
import { PackageContext, PackageContextLive } from './Package.service.js';

export const run = Effect.gen(function* () {
  const fsUtils = yield* FsUtils;
  const fs = yield* FileSystem;
  const path = yield* Path;
  const ctx = yield* PackageContext;

  const modules = yield* fsUtils
    .glob(ctx.packageJson.effect.generateExports.include, {
      nodir: true,
      cwd: 'src',
      ignore: [
        ...ctx.packageJson.effect.generateExports.exclude,
        '**/internal/**',
        '**/index.ts',
      ],
    })
    .pipe(
      Effect.map(Array.map(String.replace(/\.ts$/, ''))),
      Effect.map(Array.sort(Order.string)),
      Effect.withSpan('BabelPack/discoverModules'),
    );

  const buildPackageJson = Effect.sync(() => {
    const out: Record<string, any> = {
      name: ctx.packageJson.name,
      version: ctx.packageJson.version,
      description: ctx.packageJson.description,
      license: ctx.packageJson.license,
      repository: ctx.packageJson.repository,
      sideEffects: ['/dist/cjs/', '/dist/esm/'].flatMap((dir) =>
        ctx.packageJson.sideEffects.map((_) =>
          _.replace('.ts', '.js').replace('/src/', dir),
        ),
      ),
    };

    const addOptional = (key: keyof PackageJson) => {
      if (ctx.packageJson[key]) {
        out[key] = ctx.packageJson[key];
      }
    };

    addOptional('author');
    addOptional('homepage');
    addOptional('dependencies');
    addOptional('peerDependencies');
    addOptional('peerDependenciesMeta');
    addOptional('optionalDependencies');
    addOptional('gitHead');
    addOptional('bin');
    addOptional('bin');

    if (ctx.packageJson.publishConfig?.provenance === true) {
      out['publishConfig'] = { provenance: true };
    }

    if (
      ctx.packageJson.publishConfig?.executableFiles !== undefined &&
      ctx.packageJson.publishConfig.executableFiles.length > 0
    ) {
      out['publishConfig'] = {
        ...out['publishConfig'],
        executableFiles: ctx.packageJson.publishConfig.executableFiles,
      };
    }

    if (ctx.hasMainCjs) {
      out['main'] = './dist/cjs/index.js';
    }

    if (ctx.hasMainEsm) {
      out['module'] = './dist/esm/index.js';
    }

    if (ctx.hasMain && ctx.hasDts) {
      out['types'] = './dist/dts/index.d.ts';
    }

    out['exports'] = {
      './package.json': './package.json',
    };

    if (ctx.hasMain) {
      out['exports']['.'] = {
        ...(ctx.hasDts && { types: './dist/dts/index.d.ts' }),
        ...(ctx.hasMainEsm && { import: './dist/esm/index.js' }),
        ...(ctx.hasMainCjs && { default: './dist/cjs/index.js' }),
      };
    }

    if (Array.length(modules) > 0) {
      out['exports'] = {
        ...out['exports'],
        ...Record.fromEntries(
          modules.map((_) => {
            const conditions = {
              ...(ctx.hasDts && { types: `./dist/dts/${_}.d.ts` }),
              ...(ctx.hasEsm && { import: `./dist/esm/${_}.js` }),
              ...(ctx.hasCjs && { default: `./dist/cjs/${_}.js` }),
            };

            return [`./${_}`, conditions];
          }),
        ),
      };

      out['typesVersions'] = {
        '*': Record.fromEntries(modules.map((_) => [_, [`./dist/dts/${_}.d.ts`]])),
      };
    }

    return out;
  });

  const createProxies = Effect.forEach(
    modules,
    (_) =>
      fsUtils.mkdirCached(`dist/${_}`).pipe(
        Effect.zipRight(
          fsUtils.writeJson(`dist/${_}/package.json`, {
            main: path.relative(`dist/${_}`, `dist/dist/cjs/${_}.js`),
            module: path.relative(`dist/${_}`, `dist/dist/esm/${_}.js`),
            types: path.relative(`dist/${_}`, `dist/dist/dts/${_}.d.ts`),
            sideEffects: [],
          }),
        ),
      ),
    {
      concurrency: 'inherit',
      discard: true,
    },
  );

  const writePackageJson = buildPackageJson.pipe(
    Effect.map((_) => JSON.stringify(_, null, 2)),
    Effect.flatMap((_) => fs.writeFileString('dist/package.json', _)),
    Effect.withSpan('BabelPack/buildPackageJson'),
  );

  const mkDist = fsUtils.rmAndMkdir('dist');
  const copyReadme = fs.copy('README.md', 'dist/README.md');
  const copyLicense = fs.copy('LICENSE', 'dist/LICENSE');

  const copyEsm = ctx.hasEsm
    ? fsUtils.rmAndCopy('build/esm', 'dist/dist/esm').pipe(
        Effect.zipRight(
          fsUtils.writeJson('dist/dist/esm/package.json', {
            type: 'module',
            sideEffects: ctx.packageJson.sideEffects.map((_) =>
              _.replace('.ts', '.js').replace('/src/', '/'),
            ),
          }),
        ),
      )
    : Effect.void;
  const copyCjs = ctx.hasCjs
    ? fsUtils.rmAndCopy('build/cjs', 'dist/dist/cjs')
    : Effect.void;
  const copyDts = ctx.hasDts
    ? fsUtils.rmAndCopy('build/dts', 'dist/dist/dts')
    : Effect.void;
  const copySrc = ctx.hasSrc
    ? fsUtils
        .rmAndCopy('src', 'dist/src')
        .pipe(Effect.zipRight(fs.remove('dist/src/.index.ts').pipe(Effect.ignore)))
    : Effect.void;

  const copySources = Effect.all([copyEsm, copyCjs, copyDts, copySrc], {
    concurrency: 'inherit',
    discard: true,
  }).pipe(Effect.withSpan('BabelPack/copySources'));

  yield* mkDist;
  yield* Effect.all(
    [writePackageJson, copyReadme, copyLicense, copySources, createProxies],
    { concurrency: 'inherit', discard: true },
  ).pipe(Effect.withConcurrency(10));
}).pipe(
  Effect.provide(
    Layer.mergeAll(
      NodeFileSystem.layer,
      NodePath.layerPosix,
      FsUtilsLive,
      PackageContextLive,
    ),
  ),
);
