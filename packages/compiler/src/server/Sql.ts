import { NodeContext } from '@effect/platform-node';
import { SqliteClient, SqliteMigrator } from '@effect/sql-sqlite-node';
import { Layer } from 'effect';
import * as path from 'path';

const SqlClientLive = SqliteClient.layer({
  filename: 'twin.sqlite',
});

const MigratorLive = SqliteMigrator.layer({
  loader: SqliteMigrator.fromFileSystem(path.join(__dirname, './migrations')),
}).pipe(Layer.provide(NodeContext.layer));

export const SqlLive = MigratorLive.pipe(Layer.provideMerge(SqlClientLive));
