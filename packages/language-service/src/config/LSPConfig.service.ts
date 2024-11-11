import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Predicate from 'effect/Predicate';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import { ConnectionService, getClientCapabilities } from '../connection';
import { NativeTwinManagerService } from '../native-twin';
import {
  DEFAULT_PLUGIN_CONFIG,
  NativeTwinPluginConfiguration,
} from '../utils/constants.utils';
import { loggerUtils } from '../utils/lsp.logger.service';

interface VscodeLSPConfig {
  twinConfigFile: Option.Option<string>;
  workspaceRoot: Option.Option<string>;
  vscode: NativeTwinPluginConfiguration;
  initialized: boolean;
}

const make = Effect.gen(function* () {
  const Connection = yield* ConnectionService;
  const twin = yield* NativeTwinManagerService;
  const ref = yield* SubscriptionRef.make<VscodeLSPConfig>({
    workspaceRoot: Option.none(),
    twinConfigFile: Option.none(),
    initialized: false,
    vscode: DEFAULT_PLUGIN_CONFIG,
  });

  // const requestType = new RequestType1<string, string, string>('hola', ParameterStructures.auto);

  Connection.onDidChangeWatchedFiles(async (params) => {
    console.log('WATCHED_FILES_CHANGE: ', params);
  });

  Connection.onRequest('hola', (params) => {
    return Effect.runPromise(
      Effect.tap(Effect.succeed('RESPONSE'), (x) => {
        return Effect.log('Hello from LSP: ', x, params);
      }),
    );
  });

  const updateConfig = (changes: any) =>
    Effect.gen(function* () {
      if (!Predicate.isRecord(changes)) return;

      const currentConfig = yield* SubscriptionRef.get(ref);
      let pluginConfig = currentConfig.vscode;

      if ('nativeTwin' in changes && changes['nativeTwin']) {
        Connection.console.debug(`Configuration changes received: `);

        yield* SubscriptionRef.set(ref, {
          ...currentConfig,
          vscode: {
            ...pluginConfig,
            ...changes['nativeTwin'],
          },
        });
        loggerUtils.logFormat(yield* ref.pipe(SubscriptionRef.get)).forEach((x) => {
          Connection.console.debug(x);
        });
      }
    });

  Connection.onDidChangeConfiguration(async (changes) => {
    await Effect.runPromise(updateConfig(changes.settings));
  });

  Connection.onInitialize(async (params) => {
    const capabilities = getClientCapabilities(params.capabilities);

    const configOptions = params.initializationOptions;

    if (configOptions) {
      const twinConfigFile = Option.fromNullable<string>(configOptions?.twinConfigFile);
      const workspaceRoot = Option.fromNullable<string>(configOptions?.workspaceRoot);
      await Effect.runPromise(
        Effect.gen(function* () {
          const currentConfig = yield* SubscriptionRef.get(ref);
          yield* SubscriptionRef.set(ref, {
            ...currentConfig,
            twinConfigFile: twinConfigFile,
            workspaceRoot: workspaceRoot,
            initialized: Option.isSome(twinConfigFile),
          });
          if (Option.isSome(twinConfigFile)) {
            twin.loadUserFile(twinConfigFile.value);
          }
        }),
      );
    }

    console.debug('onInitialize CALLED');
    return capabilities;
  });

  Connection.onInitialized(() => {
    console.debug('onInitialized CALLED');
  });

  return {
    get: SubscriptionRef.get(ref),
    changes: ref.changes,
  };
});

export class LSPConfigService extends Context.Tag('vscode/lsp/config')<
  LSPConfigService,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(
    LSPConfigService,
    make.pipe(Effect.tap(() => Effect.logDebug('[LAYERS] Initialized LSPConfig Layer'))),
  );
}
