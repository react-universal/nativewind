import { HttpApiEndpoint, HttpApiGroup, OpenApi } from '@effect/platform';
import { Schema } from 'effect';
import * as TwinConfigModel from '../Domain/TwinConfig.model.js';

// /**
//  * @category ServerMiddleware
//  */
// export class TwinConfigMiddleware extends HttpApiMiddleware.Tag<TwinConfigMiddleware>()(
//   'TwinConfigMiddleware',
//   {
//     failure: TwinConfigModel.TwinConfigNotFound,
//     provides: TwinConfigModel.TwinConfigModel,
//   },
// ) {}

/**
 * @category ServerApis
 */
export class TwinConfigApi extends HttpApiGroup.make('twinConfig')
  .add(
    HttpApiEndpoint.post('create', '/:platformID')
      .setPath(Schema.Struct({ platformID: TwinConfigModel.PlatformIDFromString }))
      .addSuccess(TwinConfigModel.TwinConfigModel.json)
      .setPayload(TwinConfigModel.TwinConfigModel.jsonCreate)
      .addError(TwinConfigModel.TwinConfigNotFound),
  )
  .add(
    HttpApiEndpoint.get('getCurrentConfig', '/:platformID')
      .setPath(Schema.Struct({ platformID: TwinConfigModel.PlatformIDFromString }))
      .addSuccess(TwinConfigModel.TwinConfigModel.json)
      .addError(TwinConfigModel.TwinConfigNotFound),
  )
  // .middleware(TwinConfigMiddleware)
  .prefix('/config')
  .annotateContext(
    OpenApi.annotations({
      title: 'Twin config API',
      description: 'API for handle twin config endpoints',
    }),
  ) {}
