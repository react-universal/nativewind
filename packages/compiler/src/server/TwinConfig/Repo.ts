import { Model, SqlClient, SqlSchema } from '@effect/sql';
import { Effect, pipe } from 'effect';
import * as TwinConfigModel from '../Domain/TwinConfig.model.js';
import { SqlLive } from '../Sql.js';

export class TwinConfigRepo extends Effect.Service<TwinConfigRepo>()('TwinConfig/Repo', {
  effect: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const repo = yield* Model.makeRepository(TwinConfigModel.TwinConfigModel, {
      tableName: 'twinConfigs',
      spanPrefix: 'TwinConfigRepo',
      idColumn: 'id',
    });

    const findByPlatformSchema = SqlSchema.findOne({
      Request: TwinConfigModel.PlatformID,
      Result: TwinConfigModel.TwinConfigModel,
      execute: (key) => sql`select * from twinConfigs where platformID = ${key}`,
    });
    const findByPlatform = (id: TwinConfigModel.PlatformID) =>
      pipe(
        findByPlatformSchema(id),
        Effect.orDie,
        Effect.withSpan('TwinConfigRepo.findByPlatform'),
      );

    return { ...repo, findByPlatform };
  }),
  dependencies: [SqlLive],
}) {}
