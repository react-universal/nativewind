import { SqliteClient } from '@effect/sql-sqlite-node';

const SqlClientLive = SqliteClient.layer({
  filename: 'twin.sqlite',
});

// const MigratorLive = SqliteMigrator.layer({
//   loader: SqliteMigrator.fromFileSystem(path.join(__dirname, './migrations')),
// }).pipe(Layer.provide(NodeContext.layer));

export const SqlLive = SqlClientLive;
