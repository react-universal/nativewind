import typingsWorker from '@/lsp/workers/typings.worker?worker&url';
import * as BrowserWorker from '@effect/platform-browser/BrowserWorker';
import * as EffectWorker from '@effect/platform/Worker';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Stream from 'effect/Stream';
import * as monaco from 'monaco-editor';
import { FileSystemService } from '../services/FileSystem.service';
import type { GetPackageTypings } from './shared.schemas';

const typingsWorkerLayer = BrowserWorker.layer(
  () => new globalThis.Worker(typingsWorker, { type: 'module' }),
);

export const addPackageTypings = (packages: GetPackageTypings[]) =>
  Effect.gen(function* () {
    const fs = yield* FileSystemService;
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
              model: fs.getOrCreateModel(typing.filePath, typing.contents),
            })),
          ),
        ),
      ),
      Stream.runCollect,
    );
  }).pipe(Effect.scoped, Effect.provide(typingsWorkerLayer));
