import * as ReadonlyArray from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as HashSet from 'effect/HashSet';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import type ts from 'typescript/lib/tsserverlibrary';
import { NativeTwinService } from '../native-twin/nativeTwin.service';
import { acquireTemplateNode } from '../template/TemplateNode.service';
import { TemplateSourceHelperService } from '../template/template.context';
import { createCompletionEntryDetails } from './utils/language.utils';
import {
  completionRulesToEntries,
  completionRulesToQuickInfo,
  createCompletionsWithToken,
  filterCompletionByTemplateOffset,
} from './utils/transforms';

interface LanguageServiceShape {
  getQuickInfoAtPosition: (
    filename: string,
    position: number,
  ) => Effect.Effect<Option.Option<ts.QuickInfo>>;
  getCompletionsAtPosition: (
    filename: string,
    position: number,
  ) => Effect.Effect<ts.CompletionEntry[]>;
  getCompletionEntryDetails: (
    fileName: string,
    position: number,
    name: string,
  ) => Effect.Effect<Option.Option<ts.CompletionEntryDetails>>;
}

export class LanguageProviderService extends Context.Tag('language/service')<
  LanguageProviderService,
  LanguageServiceShape
>() {}

export const LanguageProviderServiceLive = Layer.effect(
  LanguageProviderService,
  Effect.gen(function* ($) {
    const twinService = yield* $(NativeTwinService);
    const templateService = yield* $(TemplateSourceHelperService);

    return {
      getCompletionsAtPosition(filename, position) {
        return Effect.gen(function* ($) {
          const resource = yield* $(
            acquireTemplateNode(filename, position, templateService),
          );
          const completionTokens = yield* $(
            createCompletionsWithToken(resource, twinService),
          );
          const completionRules = filterCompletionByTemplateOffset(
            completionTokens,
            Option.map(resource, (x) => x.positions.relative.offset).pipe(
              Option.getOrElse(() => 0),
            ),
          );

          const completionEntries = Option.map(resource, (node) =>
            completionRulesToEntries(node, completionRules),
          );

          return completionEntries.pipe(
            Option.getOrElse(() => []),
          ) as ts.CompletionEntry[];
        });
      },

      getCompletionEntryDetails(fileName, position, name) {
        return Effect.sync(() =>
          twinService.store.twinRules.pipe(
            HashSet.filter((x) => x.completion.className === name),
            HashSet.map((x) => createCompletionEntryDetails(x)),
            HashSet.values,
            (x) => Array.from(x),
            ReadonlyArray.fromIterable,
            ReadonlyArray.head,
          ),
        );
      },

      getQuickInfoAtPosition(filename, position) {
        return Effect.gen(function* ($) {
          const resource = yield* $(
            acquireTemplateNode(filename, position, templateService),
          );
          const completionTokens = yield* $(
            createCompletionsWithToken(resource, twinService),
          );

          const completionRules = filterCompletionByTemplateOffset(
            completionTokens,
            Option.map(resource, (x) => x.positions.relative.offset).pipe(
              Option.getOrElse(() => 0),
            ),
          );

          return Option.flatMap(resource, (node) => {
            return completionRulesToQuickInfo(node, completionRules);
          });
        });
      },
    };
  }),
);
