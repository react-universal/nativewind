import { SqlClient } from '@effect/sql';
import { Effect } from 'effect';

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  yield* sql`
      CREATE TABLE twinConfigs (
        id SERIAL PRIMARY KEY,
        platformID STRING,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `;
});
