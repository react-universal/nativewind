import { updateUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override';
import typingsWorker from '@/editor/workers/typings.worker?worker&url';
import { GetPackageTypings } from '@/utils/twin.schemas';
import * as BrowserWorker from '@effect/platform-browser/BrowserWorker';
import * as EffectWorker from '@effect/platform/Worker';
import { WorkerError } from '@effect/platform/WorkerError';
import * as RA from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { identity, pipe } from 'effect/Function';
import * as Layer from 'effect/Layer';
import { ParseError } from 'effect/ParseResult';
import * as Stream from 'effect/Stream';
import { UserConfig } from 'monaco-editor-wrapper';
import { TwinEditorConfigService } from './EditorConfig.service';
import { FileSystemService } from './FileSystem.service';

const typingsWorkerLayer = BrowserWorker.layer(
  () => new globalThis.Worker(typingsWorker, { type: 'module' }),
);

export class LanguageClientService extends Context.Tag(
  'editor/client/LanguageClientService',
)<
  LanguageClientService,
  {
    config: Effect.Effect<UserConfig>;
    getPackageTypings: (
      packages: GetPackageTypings[],
    ) => Effect.Effect<void, WorkerError | ParseError, never>;
  }
>() {
  static Live = Layer.scoped(
    LanguageClientService,
    Effect.gen(function* () {
      const { config, vscodeConfig } = yield* TwinEditorConfigService;

      const fileSystem = yield* FileSystemService;

      updateUserConfiguration(vscodeConfig);

      // extensionCtx.subscriptions.push(...highLightsProviders);

      return {
        config: Effect.succeed(config),
        getPackageTypings: (packages: GetPackageTypings[]) =>
          Effect.scoped(
            getPackageTypings(packages).pipe(
              Effect.provideService(FileSystemService, fileSystem),
              Effect.provide(typingsWorkerLayer),
            ),
          ),
      };
    }),
  );
}

const getPackageTypings = (packages: GetPackageTypings[]) =>
  Effect.gen(function* () {
    const fileSystem = yield* FileSystemService;
    Effect.provide(typingsWorkerLayer);
    const pool = yield* EffectWorker.makePoolSerialized({
      size: 1,
    });
    return yield* pipe(
      packages,
      Stream.fromIterable,
      Stream.flatMap((x) => pool.execute(x)),
      // Stream.mapError((x) => x.message),
      Stream.map((response) =>
        RA.map(response.typings, (x) => fileSystem.registerTypings(x)),
      ),
      Stream.flatMap(Stream.fromIterable),
      Stream.runForEach(identity),
    );
  });
