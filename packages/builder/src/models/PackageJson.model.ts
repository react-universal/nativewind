import { Schema } from 'effect';

const PackageJsonConfigDefaults = {
  generateExports: {
    include: ['*.ts', 'impl/*.ts'],
    exclude: [],
  },
  generateIndex: {
    include: ['*.ts'],
    exclude: [],
  },
};

export class PackageJsonConfig extends Schema.Class<PackageJsonConfig>(
  'PackageJsonConfig',
)({
  generateExports: Schema.optionalWith(
    Schema.Struct({
      include: Schema.optionalWith(Schema.Array(Schema.String), {
        default: () => PackageJsonConfigDefaults.generateExports.include,
      }),
      exclude: Schema.optionalWith(Schema.Array(Schema.String), {
        default: () => PackageJsonConfigDefaults.generateExports.exclude,
      }),
    }),
    { default: () => PackageJsonConfigDefaults.generateExports },
  ),
  generateIndex: Schema.optionalWith(
    Schema.Struct({
      include: Schema.optionalWith(Schema.Array(Schema.String), {
        default: () => PackageJsonConfigDefaults.generateIndex.include,
      }),
      exclude: Schema.optionalWith(Schema.Array(Schema.String), {
        default: () => PackageJsonConfigDefaults.generateIndex.exclude,
      }),
    }),
    { default: () => PackageJsonConfigDefaults.generateIndex },
  ),
}) {
  static readonly default = new PackageJsonConfig(PackageJsonConfigDefaults);
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
  effect: Schema.optionalWith(PackageJsonConfig, {
    default: () => PackageJsonConfig.default,
  }),
}) {
  static readonly decode = Schema.decodeUnknown(this);
}
