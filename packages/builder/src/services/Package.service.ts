/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import { FileSystem } from '@effect/platform/FileSystem';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { PackageJson } from '../models/PackageJson.model';

const make = Effect.gen(function* () {
  const fs = yield* FileSystem;

  const packageJson = fs.readFileString('./package.json').pipe(
    Effect.map((_) => JSON.parse(_)),
    Effect.flatMap(PackageJson.decode),
    Effect.withSpan('PackageContext/packageJson'),
  );

  const hasMainCjs = fs.exists('./build/cjs/index.js');
  const hasMainMjs = fs.exists('./build/mjs/index.mjs');
  const hasMainEsm = fs.exists('./build/esm/index.js');
  const hasCjs = fs.exists('./build/cjs');
  const hasMjs = fs.exists('./build/mjs');
  const hasEsm = fs.exists('./build/esm');
  const hasDts = fs.exists('./build/dts');
  const hasSrc = fs.exists('./src');

  const result = yield* Effect.all(
    {
      packageJson,
      hasMainCjs,
      hasMainMjs,
      hasMainEsm,
      hasCjs,
      hasMjs,
      hasEsm,
      hasDts,
      hasSrc,
    },
    { concurrency: 'inherit' },
  ).pipe(
    Effect.let(
      'hasMain',
      ({ hasMainCjs, hasMainEsm, hasMainMjs }) => hasMainCjs || hasMainMjs || hasMainEsm,
    ),
    Effect.withSpan('PackageContext/make'),
  );

  

  return result;
});

export interface PackageContext extends Effect.Effect.Success<typeof make> {}
export const PackageContext = Context.GenericTag<PackageContext>('PackageContext');
export const PackageContextLive = Layer.effect(PackageContext, make).pipe(
  Layer.provide(NodeFileSystem.layer),
);
