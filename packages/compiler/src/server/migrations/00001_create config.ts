import { SqlClient } from '@effect/sql';
import { Effect } from 'effect';

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  yield* sql`
      CREATE TABLE twinConfigs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platformID STRING,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `;
    yield* sql`
    CREATE TABLE twinFiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platformID STRING,
      path STRING,
      compiledHash STRING,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `;
});
