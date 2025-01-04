import { asArray } from '@native-twin/helpers';
import * as ReadonlyArray from 'effect/Array';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import * as vscode from 'vscode-languageserver-types';
import type { BaseTwinTextDocument } from '../../models/documents/BaseTwinDocument.js';
import { VscodeCompletionItem } from '../../models/language/completion.model.js';
import type {
  TwinRuleCompletion,
  TwinStore,
} from '../../models/twin/native-twin.types.js';
import type { TemplateTokenData } from '../../models/twin/template-token.model.js';
import { compareTwinRuleWithClassName } from './completion.ap.js';
import { getDocumentationMarkdown } from './language.utils.js';

export const createCompletionEntryDetails = (
  completion: vscode.CompletionItem,
  css: string,
  sheetEntry: Record<string, any>,
): vscode.CompletionItem => ({
  ...completion,
  documentation: {
    kind: vscode.MarkupKind.Markdown,
    value: getDocumentationMarkdown(sheetEntry, css),
  },
});

export const getAllCompletionRules = (
  ruleCompletions: TwinStore,
  range: vscode.Range,
) => {
  const rules = pipe(
    ruleCompletions.twinRules,
    ReadonlyArray.fromIterable,
    ReadonlyArray.filter((x) => !x.completion.className.startsWith('-')),
    ReadonlyArray.map((y) => new VscodeCompletionItem(y, range, y.completion.className)),
  );
  return pipe(
    ruleCompletions.twinVariants,
    ReadonlyArray.fromIterable,
    ReadonlyArray.map((x) => new VscodeCompletionItem(x, range, x.name)),
    ReadonlyArray.appendAll(rules),
  );
};

export const completionRulesToEntries = (
  flattenTemplateTokens: ReadonlyArray<TemplateTokenData>,
  ruleCompletions: ReadonlyArray<TwinRuleCompletion>,
  document: BaseTwinTextDocument,
) => {
  const filtered = filterTokensFromRules(flattenTemplateTokens, ruleCompletions);
  return ReadonlyArray.flatMap(filtered, (suggestion) => {
    const { match, rule } = suggestion;
    const { insertText, range } = match.adjustTextInsert(
      rule.completion.className,
      vscode.Range.create(
        document.positionAt(match.token.bodyLoc.start),
        document.positionAt(match.token.bodyLoc.end),
      ),
    );
    // const token = match.token.token;
    // if (token.type === 'CLASS_NAME') {
    //   match;
    //   if (token.value.m) {
    //     if (token.value.m.value === 'NONE') {

    //     }
    //   }
    // }
    const result = new VscodeCompletionItem(rule, range, insertText);
    return asArray(result);
  });
};

/** File private */
export const filterTokensFromRules = (
  flattenTemplateTokens: ReadonlyArray<TemplateTokenData>,
  ruleCompletions: ReadonlyArray<TwinRuleCompletion>,
) => {
  return pipe(
    ruleCompletions,
    ReadonlyArray.fromIterable,
    ReadonlyArray.filterMap((rule) => {
      const resolver = compareTwinRuleWithClassName(rule);
      const match = flattenTemplateTokens.find((x) => {
        return resolver([x.getTokenClassName()]);
      });
      if (match) {
        return Option.some({ rule, match });
      }
      return Option.none();
    }),
  );
};
