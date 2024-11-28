import { sheetEntriesToCss } from '@native-twin/css';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as HashSet from 'effect/HashSet';
import * as Option from 'effect/Option';
import type * as vscode from 'vscode-languageserver';
import { NativeTwinManagerService } from '../services/NativeTwinManager.service.js';
import * as Completions from '../utils/language/completions.maps.js';
import { getSheetEntryStyles } from '../utils/sheet.utils.js';

export const getCompletionEntryDetails = (
  entry: vscode.CompletionItem,
  _cancelToken: vscode.CancellationToken,
) =>
  Effect.gen(function* () {
    const twinService = yield* NativeTwinManagerService;
    const context = twinService.getCompilerContext();
    const completionRules = HashSet.filter(
      twinService.getTwinRules(),
      (x) => x.completion.className === entry.label,
    );
    const completionEntries = HashSet.map(completionRules, (x) => {
      const sheet = twinService.tw(x.completion.className);
      const finalSheet = getSheetEntryStyles(sheet, context);
      const css = sheetEntriesToCss(sheet);

      return Completions.createCompletionEntryDetails(entry, css, finalSheet);
    });

    return completionEntries.pipe(
      RA.fromIterable,
      RA.head,
      Option.getOrElse(() => entry),
    );
  });
