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
