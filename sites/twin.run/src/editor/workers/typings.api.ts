import * as monaco from 'monaco-editor';
import * as Effect from 'effect/Effect';
import * as Stream from 'effect/Stream';
import * as RA from 'effect/Array';
import * as EffectWorker from '@effect/platform/Worker';
import * as BrowserWorker from '@effect/platform-browser/BrowserWorker';
import { pipe } from 'effect/Function';
import { GetPackageTypings } from './shared.schemas';
import typingsWorker from '@/lsp/workers/typings.worker?worker&url';
import { getOrCreateModel } from '@/editor/monaco.api';

const typingsWorkerLayer = BrowserWorker.layer(
  () => new globalThis.Worker(typingsWorker, { type: 'module' }),
);

export const addPackageTypings = (packages: GetPackageTypings[]) =>
  Effect.gen(function* () {
    const pool = yield* EffectWorker.makePoolSerialized({
      size: 1,
    });

    return yield* pipe(
      packages,
      Stream.fromIterable,
      Stream.flatMap((x) => pool.execute(x)),
      Stream.mapEffect((response) =>
        Effect.sync(() =>
          pipe(
            response.typings,
            RA.map((typing) => ({
              disposable: monaco.languages.typescript.typescriptDefaults.addExtraLib(
                typing.contents,
                typing.filePath,
              ),
              model: getOrCreateModel(typing.filePath, typing.contents),
            })),
          ),
        ),
      ),
      Stream.runCollect,
    );
  }).pipe(Effect.scoped, Effect.provide(typingsWorkerLayer), Effect.runPromise);
