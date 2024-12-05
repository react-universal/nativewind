import { Cookies, HttpApiClient, HttpClient } from '@effect/platform';
import { NodeHttpClient } from '@effect/platform-node';
import { Effect, Ref } from 'effect';
import { TwinServerApi } from './Api.js';

export const TwinServerClient = Effect.gen(function* () {
  const cookies = yield* Ref.make(Cookies.empty);
  const client = yield* HttpApiClient.make(TwinServerApi, {
    baseUrl: 'http://localhost:3000',
    transformClient: HttpClient.withCookiesRef(cookies),
  });
  return {
    client,
  };
}).pipe(Effect.provide(NodeHttpClient.layerUndici));
