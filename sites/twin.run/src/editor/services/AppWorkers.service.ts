import * as BrowserWorker from '@effect/platform-browser/BrowserWorker';
import * as EffectWorker from '@effect/platform/Worker';
import * as Chunk from 'effect/Chunk';
import * as Console from 'effect/Console';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';
import * as monaco from 'monaco-editor';
import compilerWorker from '@/editor/workers/compiler.worker?worker&url';
import typingsWorker from '@/editor/workers/typings.worker?worker&url';
import { setTypescriptDefaults } from '@/utils/editor.utils';
import { traceLayerLogs } from '@/utils/logger.utils';
import { GetPackageTypings } from '@/utils/twin.schemas';
import { CompileCodeRequestSchema } from '../workers/shared.schemas';

const typingsInstallerWorkerLayer = BrowserWorker.layer(
  () => new globalThis.Worker(typingsWorker, { type: 'module' }),
);
const compilerWorkerLayer = BrowserWorker.layer(
  () => new globalThis.Worker(compilerWorker, { type: 'module' }),
);

const make = Effect.gen(function* () {
  return {
    installDefinitions: (packages: GetPackageTypings[]) =>
      Effect.gen(function* () {
        const pool = yield* EffectWorker.makePoolSerialized({
          size: 1,
          concurrency: 10,
        });
        return yield* Stream.fromIterable(packages).pipe(
          Stream.flatMap((x) => pool.execute(x)),
          Stream.filter((x) => x.typings.length > 1),
          Stream.runCollect,
          Effect.map((_libraries) => {
            setTypescriptDefaults();
            // monaco.languages.typescript.typescriptDefaults.
            // fileSystem.getOrCreateModel(x.filePath, x.contents);
          }),
        );
      }).pipe(Effect.scoped, Effect.provide(typingsInstallerWorkerLayer)),
    compileCode: (code: CompileCodeRequestSchema) =>
      Effect.gen(function* () {
        const pool = yield* EffectWorker.makePoolSerialized({
          size: 1,
          concurrency: 1,
        });
        return yield* pool.execute(code).pipe(
          Stream.tap((result) => Console.log(result)),
          Stream.runCollect,
        );
      }).pipe(Effect.scoped, Effect.provide(compilerWorkerLayer)),
  };
});

export class AppWorkersService extends Context.Tag('app/workers')<
  AppWorkersService,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(AppWorkersService, make).pipe(traceLayerLogs('workers_svc'));
}
