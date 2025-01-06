import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import type ts from 'typescript/lib/tsserverlibrary';
import {
  LanguageProviderService,
  LanguageProviderServiceLive,
} from './language/language.service';
import { createTwin } from './native-twin/nativeTwin.config';
import { NativeTwinServiceLive } from './native-twin/nativeTwin.service';
import { buildTSPluginService } from './plugin/TSPlugin.service';
import { TemplateSourceHelperServiceLive } from './template/template.service';

function init(modules: { typescript: typeof import('typescript/lib/tsserverlibrary') }) {
  function create(info: ts.server.PluginCreateInfo) {
    const proxy: ts.LanguageService = Object.create(null);
    for (const k of Object.keys(info.languageService) as Array<
      keyof ts.LanguageService
    >) {
      const x = info.languageService[k]!;
      // @ts-expect-error - JS runtime trickery which is tricky to type tersely
      proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args);
    }

    // const configManager = new ConfigurationManager();
    // const logger = new LanguageServiceLogger(info);
    // const intellisense = new NativeTailwindIntellisense(logger, configManager);
    const twin = createTwin(info);

    const PluginServiceLive = buildTSPluginService({
      plugin: { ts: modules.typescript, info, config: twin.pluginConfig },
      tailwind: {
        config: twin.twinConfig,
        context: twin.twin.context,
        tw: twin.twin.tw,
      },
    });

    const layer = Layer.mergeAll(
      NativeTwinServiceLive,
      TemplateSourceHelperServiceLive,
    ).pipe(Layer.provide(PluginServiceLive));

    proxy.getCompletionsAtPosition = (fileName, position, _options, _formatSettings) => {
      return Effect.gen(function* ($) {
        const languageService = yield* $(LanguageProviderService);
        return yield* $(languageService.getCompletionsAtPosition(fileName, position));
      }).pipe(
        Effect.provide(LanguageProviderServiceLive),
        Effect.provide(layer),
        Effect.map(
          (x): ts.WithMetadata<ts.CompletionInfo> => ({
            entries: x,
            isGlobalCompletion: false,
            isMemberCompletion: false,
            isNewIdentifierLocation: false,
          }),
        ),
        Effect.runSync,
      );
    };

    proxy.getCompletionEntrySymbol = (filename, position, bane, source) => {
      console.log({ filename, position, bane, source });
      return undefined;
    };
    proxy.getCompletionEntryDetails = (fileName, position, name, ...args) => {
      console.log('ARGS: ', args);
      return Effect.gen(function* ($) {
        const languageService = yield* $(LanguageProviderService);
        return yield* $(
          languageService.getCompletionEntryDetails(fileName, position, name),
        );
      }).pipe(
        Effect.provide(LanguageProviderServiceLive),
        Effect.provide(layer),
        Effect.runSync,
        Option.getOrUndefined,
      );
    };

    proxy.getQuickInfoAtPosition = (fileName, position) => {
      return Effect.gen(function* ($) {
        const languageService = yield* $(LanguageProviderService);
        return yield* $(languageService.getQuickInfoAtPosition(fileName, position));
      }).pipe(
        Effect.provide(LanguageProviderServiceLive),
        Effect.provide(layer),
        Effect.runSync,
        Option.getOrUndefined,
      );
    };

    return proxy;
  }
  return {
    create,
  };
}

export = init;
