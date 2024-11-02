import * as RA from 'effect/Array';
import * as vscode from 'vscode';
import {
  TemplateTokenData,
  TwinRuleCompletion,
  filterTokensFromRules,
  getCompletionEntryDetailsDisplayParts,
} from '@native-twin/language-service';
import { TwinTextDocument } from '../models/TwinTextDocument.model';

export const completionRulesToVscodeCompletionItems = (
  flattenTemplateTokens: ReadonlyArray<TemplateTokenData>,
  ruleCompletions: ReadonlyArray<TwinRuleCompletion>,
  document: TwinTextDocument,
): vscode.CompletionItem[] => {
  const filtered = filterTokensFromRules(flattenTemplateTokens, ruleCompletions);
  return RA.map(filtered, (suggestion) => {
    const { match, rule } = suggestion;
    const range = new vscode.Range(
      document.document.positionAt(match.token.bodyLoc.start),
      document.document.positionAt(match.token.bodyLoc.end),
    );
    const { insertText } = match.adjustTextInsert(rule.completion.className, range);

    const completion: vscode.CompletionItem = {
      label: {
        label: rule.completion.className,
        description: rule.completion.declarations.join(','),
      },
      documentation: rule.completion.declarations.join(','),
      filterText: rule.completion.className,
      sortText: rule.order.toString().padStart(8, '0'),
      detail: getCompletionEntryDetailsDisplayParts(rule)?.text,
      kind: vscode.CompletionItemKind.Color,
      insertText: insertText,
      range: range,
    };

    return completion;
  });
};
