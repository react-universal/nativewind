import { Model, SqlClient, SqlSchema } from '@effect/sql';
import { Effect, Schema } from 'effect';
import * as TwinFileModel from '../Domain/TwinCompiler.model.js';
import { SqlLive } from '../Sql.js';

export class TwinCompilerRepo extends Effect.Service<TwinCompilerRepo>()('TwinConfig/Repo', {
  effect: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const repo = yield* Model.makeRepository(TwinFileModel.TwinCompilerFileModel, {
      tableName: 'twinFiles',
      spanPrefix: 'TwinFilesRepo',
      idColumn: 'id',
    });

    const findByPath = SqlSchema.findOne({
      Request: Schema.String,
      Result: TwinFileModel.TwinCompilerFileModel,
      execute: (key) => sql`select * from twinFiles where path = ${key}`,
    });

    return { ...repo, findByPath };
  }),
  dependencies: [SqlLive],
}) {}
