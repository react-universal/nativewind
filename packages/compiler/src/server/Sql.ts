import { NodeContext } from '@effect/platform-node';
import { SqliteClient, SqliteMigrator } from '@effect/sql-sqlite-node';
import { Effect, Layer } from 'effect';
import path from 'path';
import { CompilerConfigContext } from '../services/CompilerConfig.service';

const SqlClientLive = Effect.gen(function* () {
  const env = yield* CompilerConfigContext;
  return SqliteClient.layer({
    filename: path.posix.join(env.outputDir, 'twin.sqlite'),
    spanAttributes: { sql: 'twin' },
  });
}).pipe(Layer.unwrapEffect);

const MigratorLive = SqliteMigrator.layer({
  loader: SqliteMigrator.fromFileSystem(path.join(__dirname, './migrations')),
}).pipe(Layer.provide(NodeContext.layer));

export const SqlLive = MigratorLive.pipe(Layer.provideMerge(SqlClientLive));
