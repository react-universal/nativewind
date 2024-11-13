import * as BrowserWorker from '@effect/platform-browser/BrowserWorker';
import * as EffectWorker from '@effect/platform/Worker';
import * as RA from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { identity, pipe } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';
import typingsWorker from '@/editor/workers/typings.worker?worker&url';
import { GetPackageTypings } from '@/utils/twin.schemas';
import { FileSystemService } from './FileSystem.service';

const typingsInstallerWorkerLayer = BrowserWorker.layer(
  () => new globalThis.Worker(typingsWorker, { type: 'module' }),
);

const make = Effect.gen(function* () {
  const fileSystem = yield* FileSystemService;

  return {
    installPackagesTypings: (packages: GetPackageTypings[]) =>
      Effect.gen(function* () {
        const pool = yield* EffectWorker.makePoolSerialized({
          size: 1,
        });
        return yield* pipe(
          packages,
          Stream.fromIterable,
          Stream.flatMap((x) => pool.execute(x)),
          Stream.map((response) =>
            RA.map(response.typings, (x) => fileSystem.registerTypescriptTyping(x)),
          ),
          Stream.flatMap(Stream.fromIterable),
          Stream.runForEach(identity),
        );
      }).pipe(Effect.scoped, Effect.provide(typingsInstallerWorkerLayer)),
  };
});

export class AppWorkersService extends Context.Tag('app/workers')<
  AppWorkersService,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(AppWorkersService, make);
}
