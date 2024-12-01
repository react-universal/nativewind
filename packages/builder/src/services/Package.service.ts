/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import { FileSystem } from '@effect/platform/FileSystem';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

const effectConfigDefaults = {
  generateExports: {
    include: ['*.ts', 'impl/*.ts'],
    exclude: [],
  },
  generateIndex: {
    include: ['*.ts'],
    exclude: [],
  },
};
export class EffectConfig extends Schema.Class<EffectConfig>('EffectConfig')({
  generateExports: Schema.optionalWith(
    Schema.Struct({
      include: Schema.optionalWith(Schema.Array(Schema.String), {
        default: () => effectConfigDefaults.generateExports.include,
      }),
      exclude: Schema.optionalWith(Schema.Array(Schema.String), {
        default: () => effectConfigDefaults.generateExports.exclude,
      }),
    }),
    { default: () => effectConfigDefaults.generateExports },
  ),
  generateIndex: Schema.optionalWith(
    Schema.Struct({
      include: Schema.optionalWith(Schema.Array(Schema.String), {
        default: () => effectConfigDefaults.generateIndex.include,
      }),
      exclude: Schema.optionalWith(Schema.Array(Schema.String), {
        default: () => effectConfigDefaults.generateIndex.exclude,
      }),
    }),
    { default: () => effectConfigDefaults.generateIndex },
  ),
}) {
  static readonly default = new EffectConfig(effectConfigDefaults);
}

export class PackageJson extends Schema.Class<PackageJson>('PackageJson')({
  name: Schema.String,
  version: Schema.String,
  description: Schema.String,
  private: Schema.optionalWith(Schema.Boolean, { default: () => false }),
  publishConfig: Schema.optional(
    Schema.Struct({
      provenance: Schema.optionalWith(Schema.Boolean, { default: () => false }),
      executableFiles: Schema.optional(Schema.Array(Schema.String)),
    }),
  ),
  license: Schema.String,
  author: Schema.optional(Schema.String),
  repository: Schema.Union(
    Schema.String,
    Schema.Struct({
      type: Schema.String,
      url: Schema.String,
      directory: Schema.optional(Schema.String),
    }),
  ),
  homepage: Schema.optional(Schema.String),
  sideEffects: Schema.optionalWith(Schema.Array(Schema.String), {
    default: () => [],
  }),
  dependencies: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.String }),
  ),
  peerDependencies: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.String }),
  ),
  peerDependenciesMeta: Schema.optional(
    Schema.Record({
      key: Schema.String,
      value: Schema.Struct({ optional: Schema.Boolean }),
    }),
  ),
  optionalDependencies: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.String }),
  ),
  gitHead: Schema.optional(Schema.String),
  bin: Schema.optional(Schema.Unknown),
  effect: Schema.optionalWith(EffectConfig, {
    default: () => EffectConfig.default,
  }),
}) {
  static readonly decode = Schema.decodeUnknown(this);
}

const make = Effect.gen(function* (_) {
  const fs = yield* _(FileSystem);

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

  return yield* _(
    Effect.all(
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
    ),
    Effect.let(
      'hasMain',
      ({ hasMainCjs, hasMainEsm, hasMainMjs }) => hasMainCjs || hasMainMjs || hasMainEsm,
    ),
    Effect.withSpan('PackageContext/make'),
  );
});

export interface PackageContext extends Effect.Effect.Success<typeof make> {}
export const PackageContext = Context.GenericTag<PackageContext>('PackageContext');
export const PackageContextLive = Layer.effect(PackageContext, make).pipe(
  Layer.provide(NodeFileSystem.layer),
);
