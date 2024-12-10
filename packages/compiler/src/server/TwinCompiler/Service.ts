import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import { FsUtils, FsUtilsLive } from '../../internal/fs.utils.js';
import * as TwinFileModel from '../Domain/TwinCompiler.model.js';
import { PlatformID } from '../Domain/TwinConfig.model.js';
import { SqlLive } from '../Sql.js';
import * as TwinCompilerRepo from './Repo.js';

export class TwinCompilerService extends Effect.Service<TwinCompilerService>()(
  'TwinCompilerService',
  {
    effect: Effect.gen(function* () {
      const repo = yield* TwinCompilerRepo.TwinCompilerRepo;
      const fs = yield* FsUtils;

      const getOrCreateFile = (path: string, platformID: PlatformID) =>
        Effect.gen(function* () {
          const record = yield* findByPlatform(path);
          const compiledHash = yield* fs.getFileMD5(path);
          if (Option.isNone(record)) {
            return yield* create({ compiledHash, path, platformID });
          }
          return record.value;
        }).pipe(
          Effect.mapError((error) => {
            return TwinFileModel.TwinCompilerFileModelNotFound.make(error);
          }),
        );

      const create = (
        twinFile: typeof TwinFileModel.TwinCompilerFileModel.jsonCreate.Type,
      ) =>
        pipe(
          repo.insert(TwinFileModel.TwinCompilerFileModel.insert.make(twinFile)),
          Effect.withSpan('TwinCompilerRepo.create', {
            attributes: { twinFile },
          }),
        );

      const findByPlatform = (id: string) => {
        return repo
          .findByPath(id)
          .pipe(Effect.withSpan('TwinCompilerRepo.findByID', { attributes: { id } }));
      };

      return { create, findByPlatform, getOrCreateFile };
    }),
    dependencies: [SqlLive, FsUtilsLive, TwinCompilerRepo.TwinCompilerRepo.Default],
  },
) {}
