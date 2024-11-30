import { SqlClient } from '@effect/sql';
import { Effect, Option, pipe } from 'effect';
import * as TwinConfigModel from '../Domain/TwinConfig.model.js';
import { SqlLive } from '../Sql.js';
import * as TwinConfigRepo from './Repo.js';

export class TwinConfigService extends Effect.Service<TwinConfigService>()(
  'TwinConfigService',
  {
    effect: Effect.gen(function* () {
      const repo = yield* TwinConfigRepo.TwinConfigRepo;
      const sql = yield* SqlClient.SqlClient;

      const create = (
        platformID: TwinConfigModel.PlatformID,
        config: typeof TwinConfigModel.TwinConfigModel.jsonCreate.Type,
      ) =>
        pipe(
          repo.insert(
            TwinConfigModel.TwinConfigModel.insert.make({
              ...config,
              platformID,
            }),
          ),
          Effect.withSpan('TwinConfigModel.create', {
            attributes: { config, platformID },
          }),
        );

      const findByPlatform = (id: TwinConfigModel.PlatformID) => {
        return repo
          .findByPlatform(id)
          .pipe(Effect.withSpan('TwinConfigModel.findByID', { attributes: { id } }));
      };

      const with_ = <B, E, R>(
        id: TwinConfigModel.PlatformID,
        f: (config: TwinConfigModel.TwinConfigModel) => Effect.Effect<B, E, R>,
      ): Effect.Effect<B, E | TwinConfigModel.TwinConfigNotFound, R> => {
        return repo.findByPlatform(id).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () =>
                Effect.fail(
                  new TwinConfigModel.TwinConfigNotFound({ message: 'NotFound' }),
                ),
              onSome: Effect.succeed,
            }),
          ),
          Effect.flatMap(f),
          sql.withTransaction,
          Effect.catchTag('SqlError', (e) => Effect.die(e)),
          Effect.withSpan('TwinConfigModel.with', { attributes: { id } }),
        );
      };

      return { create, findByPlatform, with: with_ };
    }),
    dependencies: [SqlLive, TwinConfigRepo.TwinConfigRepo.Default],
  },
) {}
