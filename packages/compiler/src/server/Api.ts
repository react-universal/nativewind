import { HttpApi, OpenApi } from '@effect/platform';
import { TwinConfigApi } from './TwinConfig/Api.js';

export class TwinServerApi extends HttpApi.empty
  .add(TwinConfigApi)
  .annotate(OpenApi.Title, 'Twin Api Groups') {}
