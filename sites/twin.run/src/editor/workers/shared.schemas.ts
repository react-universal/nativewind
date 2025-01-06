import * as Schema from 'effect/Schema';

export class TwinTyping extends Schema.Class<TwinTyping>('TwinTyping')({
  filePath: Schema.String,
  contents: Schema.String,
}) {}

export class TwinPackageTypings extends Schema.Class<TwinPackageTypings>(
  'TwinPackageTypings',
)({
  name: Schema.String,
  typings: Schema.Array(TwinTyping),
}) {}

export class GetPackageTypings extends Schema.TaggedRequest<GetPackageTypings>()(
  'GetPackageTypings',
  {
    failure: Schema.Never,
    success: TwinPackageTypings,
    payload: {
      name: Schema.String,
      version: Schema.String,
    },
  },
) {}

export const CompiledCodeResponse = Schema.Struct({
  css: Schema.String,
  js: Schema.String,
});

export class CompileCodeRequestSchema extends Schema.TaggedRequest<CompileCodeRequestSchema>()(
  'CompileCodeRequestSchema',
  {
    failure: Schema.String,
    success: CompiledCodeResponse,
    payload: {
      css: Schema.String,
      jsx: Schema.String,
    },
  },
) {}
