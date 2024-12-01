import { Path, FileSystem } from '@effect/platform';
import { NodeFileSystem, NodePath } from '@effect/platform-node';
import { Context, Array, Effect, Layer, Order, Record, String } from 'effect';
import { FsUtils, FsUtilsLive } from './FsUtils.service.js';
import { PackageContext, PackageJson } from './Package.service.js';

const make = Effect.gen(function* () {
  const fsUtils = yield* FsUtils;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const ctx = yield* PackageContext;

  const modules = yield* fsUtils
    .glob(ctx.packageJson.effect.generateExports.include, {
      nodir: true,
      cwd: 'src',
      ignore: [...ctx.packageJson.effect.generateExports.exclude],
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

  const mkDist = yield* fsUtils.rmAndMkdir('dist');
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

  yield* Effect.all(
    [writePackageJson, copyReadme, copyLicense, copySources, createProxies],
    { concurrency: 'inherit', discard: true },
  ).pipe(Effect.withConcurrency(10));

  const createProxiesDev = Effect.forEach(
    modules,
    (_) =>
      fsUtils.mkdirCached(`build/dev/${_}`).pipe(
        Effect.zipRight(
          fsUtils.writeJson(`build/dev/${_}/package.json`, {
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

  yield* createProxiesDev;

  const devPackage = buildPackageJson.pipe(
    Effect.map((_) => JSON.stringify(_, null, 2)),
    Effect.map((x) => x.replaceAll(/\/dist\//g, '/build/')),
    Effect.map((x) => JSON.parse(x)),
    Effect.flatMap((incoming) => {
      return Effect.gen(function* () {
        const original = yield* fs
          .readFile('./package.json')
          .pipe(Effect.map((x) => new TextDecoder().decode(x)));

        const originalJSON = JSON.parse(original);

        originalJSON['exports'] = incoming.exports;
        originalJSON['main'] = incoming.main;
        originalJSON['module'] = incoming.module;
        originalJSON['types'] = incoming.types;

        const result = JSON.stringify(originalJSON, null, 2).replaceAll(
          '/dist/',
          '/build/',
        );
        yield* fs.writeFileString('./package.json', result);
        return JSON.parse(result);
      });
    }),
  );

  return {
    copyCommonFiles: Effect.all([copyReadme, copyLicense, copySources], {
      concurrency: 'inherit',
      discard: true,
    }).pipe(Effect.withConcurrency(10)),
    writePackageJson,
    createProxies,
    mkDist,
    modules,
    buildPackageJson,
    devPackage,
  };
});

export interface BabelPackContext extends Effect.Effect.Success<typeof make> {}
export const BabelPackContext = Context.GenericTag<BabelPackContext>(
  'twin-build/BabelPackContext',
);
export const BabelPackContextLive = Layer.effect(BabelPackContext, make).pipe(
  Layer.provide(FsUtilsLive),
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(NodePath.layerPosix),
);
