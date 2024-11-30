import { HttpApiSchema } from '@effect/platform';
import { Model } from '@effect/sql';
import { Context, Schema } from 'effect';

export const ConfigID = Schema.Number.pipe(Schema.brand('ConfigID'));
export type ConfigID = typeof ConfigID.Type;

export const ConfigIDFromString = Schema.NumberFromString.pipe(Schema.compose(ConfigID));

export const PlatformID = Schema.Literal('iOS', 'android', 'web', 'native').pipe(
  Schema.brand('PlatformID'),
);
export type PlatformID = typeof PlatformID.Type;

export const PlatformIDFromString = Schema.NonEmptyTrimmedString.pipe(
  Schema.compose(PlatformID),
);
/**
 * @category ServerModels
 */
export class TwinConfigModel extends Model.Class<TwinConfigModel>('TwinConfig')({
  id: Model.Generated(ConfigID),
  platformID: Model.GeneratedByApp(PlatformID),
  // projectFiles: Model.(Schema.String),
  // runningPlatforms: Schema.HashSet(Schema.String),
  // allowedFilePaths: Schema.Array(Schema.String),
  // allowedPathPatterns: Schema.Array(Schema.String),
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate,
}) {}

/**
 * @category ServerModels
 */
export class TwinCurrentConfig extends Context.Tag('TwinCurrentConfig')<
  TwinCurrentConfig,
  TwinConfigModel
>() {}

/**
 * @category ServerModels
 */
export class TwinConfigNotFound extends Schema.TaggedError<TwinConfigNotFound>()(
  'TwinConfigNotFound',
  {
    message: Schema.String,
  },
  HttpApiSchema.annotations({
    status: 404,
    description: 'Must provide a twin configuration',
  }),
) {}
