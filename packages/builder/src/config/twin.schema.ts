import * as JSONSchema from 'effect/JSONSchema';
import * as Schema from 'effect/Schema';

// import fs from 'fs';
// import path from 'path';

const createDefaultOptional = <A, I, O extends A>(
  schema: Schema.Schema<A, I>,
  fallback: O,
) =>
  Schema.optionalWith(schema, {
    default: () => fallback,
  });

const logs = Schema.Union(
  Schema.Boolean,
  Schema.Literal('info'),
  Schema.Literal('debug'),
  Schema.Literal('verbose'),
)
  .annotations({
    description: 'Log config',
    identifier: 'log',
    default: false,
    title: 'build logs',
  })
  .pipe((x) => createDefaultOptional(x, false));

const platform = Schema.Union(Schema.Literal('browser'), Schema.Literal('node'));
const minify = Schema.Boolean.annotations({ default: false }).pipe((x) =>
  createDefaultOptional(x, false),
);
const reactNative = Schema.Boolean.annotations({ default: false }).pipe((x) =>
  createDefaultOptional(x, false),
);
const types = Schema.Boolean.annotations({
  default: true,
  description: 'generate .d.ts \nDefault: true',
  documentation: 'Defaults: true',
  identifier: 'types',
  title: 'Ts types',
  batching: 'inherit',
}).pipe((x) => createDefaultOptional(x, true));

const vscode = Schema.Boolean.annotations({ default: false }).pipe((x) =>
  createDefaultOptional(x, false),
);
const entries = Schema.Array(Schema.String)
  .annotations({ default: ['./src/index.ts'] })
  .pipe((x) => createDefaultOptional(x, ['./src/index.ts']));

const bundle = Schema.Boolean.annotations({ default: false }).pipe((x) =>
  createDefaultOptional(x, false),
);
const production = Schema.Boolean.annotations({ default: false }).pipe((x) =>
  createDefaultOptional(x, false),
);
const runner = Schema.Union(Schema.Literal('rollup'), Schema.Literal('esbuild'))
  .annotations({ default: 'rollup' })
  .pipe((x) => createDefaultOptional(x, 'rollup'));

const external = Schema.Array(Schema.String)
  .annotations({ default: ['vscode', 'react', 'react/jsx-runtime'] })
  .pipe((x) => createDefaultOptional(x, ['vscode', 'react', 'react/jsx-runtime']));

const configFileObject = Schema.Struct({
  $schema: Schema.String,
  runner,
  logs,
  minify,
  reactNative,
  platform,
  types,
  entries,
  external,
  vscode,
  bundle,
  production,
}).annotations({
  title: 'Twin Schema',
  identifier: 'twin',
  description: 'Twin JSON Schema',
});
export const twinJSONSchema = JSONSchema.make(configFileObject);

export type TwinConfigFileOptions = (typeof configFileObject)['Type'];
// const schema = JSON.stringify(twinJSONSchema, null, 2);
// fs.writeFileSync(path.join(process.cwd(), 'twin.schema.json'), schema);
