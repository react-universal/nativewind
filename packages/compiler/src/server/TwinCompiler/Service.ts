// import { SqlClient } from '@effect/sql';
import { Effect, Option, pipe } from 'effect';
import { FsUtils, FsUtilsLive } from '../../services/FsUtils.service.js';
import * as TwinFileModel from '../Domain/TwinCompiler.model.js';
import { PlatformID } from '../Domain/TwinConfig.model.js';
import { SqlLive } from '../Sql.js';
import * as TwinCompilerRepo from './Repo.js';

export class TwinCompilerService extends Effect.Service<TwinCompilerService>()(
  'TwinCompilerService',
  {
    effect: Effect.gen(function* () {
      const repo = yield* TwinCompilerRepo.TwinCompilerRepo;
      // const sql = yield* SqlClient.SqlClient;
      const fsUtils = yield* FsUtils;

      const getOrCreateFile = (path: string, platformID: PlatformID) =>
        Effect.gen(function* () {
          const record = yield* findByPlatform(path);
          const compiledHash = yield* fsUtils.getFileMD5(path);
          if (Option.isNone(record)) {
            return yield* create({ compiledHash, path, platformID });
          }
          return record.value;
        }).pipe(
          Effect.mapError((error) => {
            return TwinFileModel.TwinCompilerFileModelNotFound.make({
              message: 'asd',
            });
          }),
        );

      const create = (
        twinFile: typeof TwinFileModel.TwinCompilerFileModel.jsonCreate.Type,
      ) =>
        pipe(
          repo.insert(TwinFileModel.TwinCompilerFileModel.insert.make(twinFile)),
          Effect.withSpan('TwinConfigModel.create', {
            attributes: { twinFile },
          }),
        );

      const findByPlatform = (id: string) => {
        return repo
          .findByPath(id)
          .pipe(Effect.withSpan('TwinConfigModel.findByID', { attributes: { id } }));
      };

      return { create, findByPlatform, getOrCreateFile };
    }),
    dependencies: [SqlLive, FsUtilsLive, TwinCompilerRepo.TwinCompilerRepo.Default],
  },
) {}
