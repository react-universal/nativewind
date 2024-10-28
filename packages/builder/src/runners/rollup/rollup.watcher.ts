import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import { compose, pipe } from 'effect/Function';
import * as Stream from 'effect/Stream';
import * as rollup from 'rollup';
import { inspect } from 'util';
import {
  getBundleModules,
  serializeBuildResult,
  serializeOutputChunks,
} from './plugins/analyzer.plugin';
import { createRollupConfig, rollupDefaultConfigs } from './rollup.config';

export const rollupWatcher = Effect.gen(function* () {
  const offerResult = (_message: string) => {
    console.log(_message, '\n');
  };

  const plugin: rollup.Plugin = {
    name: 'twin-builder',
    watchChange(id, change) {
      if (change.event === 'create') {
        return offerResult(`watchChange[twin-builder] Create new watcher... ${id}`);
      }
      if (change.event === 'delete') {
        return offerResult(`watchChange[twin-builder] Delete watcher... ${id}`);
      }
      if (change.event === 'update') {
        return offerResult(`watchChange[twin-builder] Update watcher... ${id}`);
      }
      return;
    },
    writeBundle(_, bundle) {
      pipe(
        getBundleModules(bundle),
        compose(serializeOutputChunks, serializeBuildResult),
        (x) => offerResult(`Build finished (${_.format}):\n ${x} \n`),
      );
    },
    closeWatcher() {
      return offerResult(`[twin-builder] Closing watcher...`);
    },
  };
  const rollupConfigs = yield* Effect.sync(() =>
    createRollupConfig(rollupDefaultConfigs, [plugin]),
  );

  const watcher = yield* Effect.sync(() => rollup.watch(rollupConfigs));
  return Stream.async<string>((emit) => {
    watcher
      .on('change', async (event) => {
        return emit.single(`[twin-builder] Detected change in: ${event}`);
      })
      .on('restart', async () => {
        return emit.single(`[twin-builder] Build restarted...`);
      })
      .on('event', async (event) => {
        switch (event.code) {
          case 'END':
          case 'START':
            return;
          case 'BUNDLE_START':
            return emit.single(`BUNDLE_START: ${event.output}`);
          case 'BUNDLE_END':
            return event.result.close();
          case 'ERROR':
            return emit.single(
              `[twin-builder] Build error \n ${inspect(event.error, false, null, true)}.`,
            );
        }
      })
      .on('close', async () => {
        return emit.done(Exit.succeed(`[twin-builder] Build closed.`));
      });
    return Effect.void;
  });
});
