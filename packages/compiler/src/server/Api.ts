import { HttpApi, OpenApi } from '@effect/platform';
import { TwinConfigApi } from './TwinConfig/Api.js';
import { TwinCompilerApi } from './TwinCompiler/Api.js';

export class TwinServerApi extends HttpApi.empty
  .add(TwinConfigApi)
  .add(TwinCompilerApi)
  .annotate(OpenApi.Title, 'Twin Api Groups') {}
