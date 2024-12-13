import * as ReadonlyArray from 'effect/Array';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as HashSet from 'effect/HashSet';
import * as Option from 'effect/Option';
import ts from 'typescript';
import * as vscode from 'vscode-languageserver-types';
import type { NativeTwinService } from '../../native-twin/nativeTwin.service';
import type { TwinRuleCompletionWithToken } from '../../native-twin/nativeTwin.types';
import type { TemplateNode } from '../../template/TemplateNode.service';
import {
  type CompletionPart,
  getCompletionEntryDetailsDisplayParts,
  getCompletionParts,
  getCompletionTokenKind,
  getDocumentation,
  getKindModifiers,
} from './language.utils';

export const createCompletionsWithToken = (
  template: Option.Option<TemplateNode>,
  twinService: NativeTwinService['Type'],
) => {
  return Effect.sync(() => {
    const positionTokens: CompletionPart[] = Option.map(template, (node) =>
      pipe(
        ReadonlyArray.fromIterable(node.parsedTemplate),
        ReadonlyArray.map((x) => getCompletionParts(x)),
        ReadonlyArray.flatten,
      ),
    ).pipe(Option.getOrElse(() => []));

    return pipe(
      twinService.store.twinRules,
      HashSet.flatMap((ruleInfo) => {
        return HashSet.fromIterable(positionTokens).pipe(
          HashSet.filter((x) => {
            if (ruleInfo.completion.className === x.text) {
              return true;
            }

            return ruleInfo.completion.className.startsWith(x.text);
          }),
          HashSet.map(
            (token): TwinRuleCompletionWithToken => ({
              completion: ruleInfo.completion,
              composition: ruleInfo.composition,
              rule: ruleInfo.rule,
              token,
            }),
          ),
        );
      }),
    );
  });
};

export const filterCompletionByTemplateOffset = (
  tokens: HashSet.HashSet<TwinRuleCompletionWithToken>,
  position: number,
) => HashSet.filter(tokens, (x) => position >= x.token.start && position <= x.token.end);

export const completionRuleToEntry = (
  completionRule: TwinRuleCompletionWithToken,
  replacementSpan: ts.TextSpan,
  index: number,
): ts.CompletionEntry => {
  const { rule, completion } = completionRule;
  return {
    symbol: {} as any,
    kind: getCompletionTokenKind(completionRule),
    filterText: completion.className,
    kindModifiers: getKindModifiers(rule),
    name: completion.className,
    sortText: index.toString().padStart(8, '0'),
    sourceDisplay: getCompletionEntryDetailsDisplayParts(completionRule),
    labelDetails: {
      description: completion.className,
      detail: completion.declarationValue,
    },
    replacementSpan,
    insertText: completion.className,
    source: completion.className,
    isRecommended: true,
  };
};

export const completionRulesToEntries = (
  node: TemplateNode,
  completionRules: HashSet.HashSet<TwinRuleCompletionWithToken>,
) => {
  let i = 0;
  return HashSet.map(completionRules, (rule) => {
    const documentPosition = node.node.pos + 1;
    const documentStart = rule.token.start + documentPosition;
    const documentEnd = rule.token.end + documentPosition;
    const replacementSpan: ts.TextSpan = {
      start: node.templateContext.toOffset(
        node.templateContext.toPosition(documentStart),
      ),
      length:
        node.templateContext.toOffset(node.templateContext.toPosition(documentEnd)) -
        node.templateContext.toOffset(node.templateContext.toPosition(documentStart)),
    };
    return completionRuleToEntry(rule, replacementSpan, i++);
  }).pipe(HashSet.values, (x) => Array.from(x));
};

export function completionRulesToQuickInfo(
  node: TemplateNode,
  completionRules: HashSet.HashSet<TwinRuleCompletionWithToken>,
): Option.Option<ts.QuickInfo> {
  return HashSet.map(completionRules, (rule) => {
    const documentPosition = node.node.pos + 1;
    const documentStart = rule.token.start + documentPosition;
    const documentEnd = rule.token.end + documentPosition;
    const replacementSpan: ts.TextSpan = {
      start: node.templateContext.toOffset(
        node.templateContext.toPosition(documentStart),
      ),
      length:
        node.templateContext.toOffset(node.templateContext.toPosition(documentEnd)) -
        node.templateContext.toOffset(node.templateContext.toPosition(documentStart)),
    };
    return completionRuleToQuickInfo(rule, replacementSpan);
  }).pipe(HashSet.values, (x) => ReadonlyArray.fromIterable(x), ReadonlyArray.head);
}

export function completionRuleToQuickInfo(
  item: TwinRuleCompletionWithToken,
  replacementSpan: ts.TextSpan,
): ts.QuickInfo {
  const displayParts = getCompletionEntryDetailsDisplayParts(item);
  const documentation = getDocumentation(item, replacementSpan);
  return {
    kind: ts.ScriptElementKind.string,
    kindModifiers: displayParts.length > 0 ? 'color' : '',
    displayParts,
    textSpan: replacementSpan,
    documentation: [
      {
        kind: vscode.MarkupKind.Markdown,
        text: documentation,
      },
    ],
  };
}
