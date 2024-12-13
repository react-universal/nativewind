import type { FinalSheet } from '@native-twin/css';
import * as ReadonlyArray from 'effect/Array';
import * as HashSet from 'effect/HashSet';
import type * as Option from 'effect/Option';
import * as vscode from 'vscode-languageserver-types';
import type { TwinRuleCompletion } from '../../models/twin/native-twin.types.js';
import { getDocumentationMarkdown } from './language.utils.js';

export const completionRulesToQuickInfo = (
  completionRules: HashSet.HashSet<TwinRuleCompletion>,
  sheetEntry: FinalSheet,
  css: string,
  range: vscode.Range,
): Option.Option<vscode.Hover> =>
  HashSet.map(completionRules, (_rule) => {
    return completionRuleToQuickInfo(sheetEntry, css, range);
  }).pipe(HashSet.values, (x) => ReadonlyArray.fromIterable(x), ReadonlyArray.head);

export const completionRuleToQuickInfo = (
  sheetEntry: FinalSheet,
  css: string,
  range: vscode.Range,
): vscode.Hover => ({
  range,
  contents: {
    kind: vscode.MarkupKind.Markdown,
    value: getDocumentationMarkdown(sheetEntry, css),
  },
});
