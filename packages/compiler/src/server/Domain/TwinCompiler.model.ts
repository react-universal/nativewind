import { HttpApiSchema } from '@effect/platform';
import { Model } from '@effect/sql';
import { Schema } from 'effect';
import { PlatformID } from './TwinConfig.model';

export const FileID = Schema.Number.pipe(Schema.brand('FileID'));
export type FileID = typeof FileID.Type;

export const FileIDFromString = Schema.NumberFromString.pipe(Schema.compose(FileID));

/**
 * @category ServerModels
 */
export class TwinCompilerFileModel extends Model.Class<TwinCompilerFileModel>(
  'TwinCompilerFileModel',
)({
  id: Model.Generated(FileID),
  platformID: PlatformID,
  path: Schema.String,
  compiledHash: Schema.String,
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
export class TwinCompilerFileModelNotFound extends Schema.TaggedError<TwinCompilerFileModelNotFound>()(
  'TwinCompilerFileModelNotFound',
  {
    message: Schema.String,
  },
  HttpApiSchema.annotations({
    status: 404,
    description: 'Cant find file',
  }),
) {}
