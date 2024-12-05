import { HttpApiBuilder } from '@effect/platform';
import { Layer } from 'effect';
import { FsUtilsLive } from '../internal/fs.utils.js';
import { TwinServerApi } from './Api.js';
import { HttpTwinCompilerLive } from './TwinCompiler/Http.js';
import { HttpTwinConfigLive } from './TwinConfig/Http.js';

export const TwinServerApiLive = Layer.provide(HttpApiBuilder.api(TwinServerApi), [
  HttpTwinConfigLive,
  HttpTwinCompilerLive,
]).pipe(Layer.provide(FsUtilsLive));
