// import { NodeContext } from '@effect/platform-node';
import { SqliteClient, SqliteMigrator } from '@effect/sql-sqlite-node';
import { Effect, Layer } from 'effect';
import path from 'path';
import { FsUtils } from '../internal/fs.utils';
import { CompilerConfigContext } from '../services/CompilerConfig.service';

const SqlClientLive = Effect.gen(function* () {
  const env = yield* CompilerConfigContext;
  const fsUtils = yield* FsUtils;
  yield* fsUtils.mkdirCached(env.outputDir);
  const client = yield* SqliteClient.make({
    filename: path.posix.join(env.outputDir, 'twin.sqlite'),
    spanAttributes: { sql: 'twin' },
  });
  return SqliteClient.layer(client.config);
}).pipe(Layer.unwrapEffect);

const MigratorLive = SqliteMigrator.layer({
  loader: SqliteMigrator.fromFileSystem(path.join(__dirname, './migrations')),
});

export const SqlLive = MigratorLive.pipe(Layer.provideMerge(SqlClientLive));
