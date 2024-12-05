import { HttpApiEndpoint, HttpApiGroup, OpenApi } from '@effect/platform';
import { Schema } from 'effect';
import * as TwinFileModel from '../Domain/TwinCompiler.model.js';
import { PlatformID } from '../Domain/TwinConfig.model.js';

/**
 * @category ServerApis
 */
export class TwinCompilerApi extends HttpApiGroup.make('twinCompiler')
  .add(
    HttpApiEndpoint.post('compile-file', '/')
      .addSuccess(TwinFileModel.TwinCompilerFileModel.json)
      .setPayload(
        Schema.Struct({
          path: Schema.String,
          platformID: PlatformID,
        }),
      )
      .addError(TwinFileModel.TwinCompilerFileModelNotFound),
  )
  // .middleware(TwinConfigMiddleware)
  .prefix('/compiler')
  .annotateContext(
    OpenApi.annotations({
      title: 'Twin compiler API',
      description: 'API for file compilations',
    }),
  ) {}
