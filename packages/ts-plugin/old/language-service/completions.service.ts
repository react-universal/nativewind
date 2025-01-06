import { TinyColor } from '@ctrl/tinycolor';
import { TemplateContext } from 'typescript-template-language-service-decorator';
import ts from 'typescript/lib/tsserverlibrary';
import * as vscode from 'vscode-languageserver-types';
import { RuntimeTW } from '@native-twin/core';
import { ClassCompletionToken, CompletionToken } from '../types';
import { debugLog } from '../utils';
import { NativeTailwindIntellisense } from './intellisense.service';
import { ParsedCompletionRule, parse } from './parser';

export function getCompletionsAtPosition(
  context: TemplateContext,
  position: ts.LineAndCharacter,
  intellisense: NativeTailwindIntellisense,
): ts.WithMetadata<ts.CompletionInfo> {
  const text = context.text;
  const textOffset = context.toOffset(position);
  const parsedRule = parse(text, textOffset, true);

  // ts.SyntaxKind.NoSubstitutionTemplateLiteral
  // ts.SyntaxKind.TemplateExpression
  return {
    isGlobalCompletion: false,
    isMemberCompletion: false,
    isNewIdentifierLocation: false,
    entries: getCompletionEntries(context, parsedRule, intellisense),
  };
}

function getCompletionEntries(
  context: TemplateContext,
  rule: ParsedCompletionRule,
  intellisense: NativeTailwindIntellisense,
): ts.CompletionEntry[] {
  const result: ts.CompletionEntry[] = [];
  const { completions } = intellisense;
  const hasScreenValue = rule.variants.some((x) => completions().screens.has(x.value));
  const screens = hasScreenValue ? [] : Array.from(completions().variants.values());
  let index = screens.length;
  if (!hasScreenValue && rule.raw == '') {
    screens.forEach((x, i) => {
      result.push({
        kind: ts.ScriptElementKind.alias,
        name: x.name,
        sortText: i.toString().padStart(8, '0'),
        kindModifiers: getCompletionTokenKind(x),
        labelDetails: { description: 'Screen Media Query', detail: 'Screens' },
      });
    });
  }
  for (const token of completions().classes.values()) {
    const nextToken = createCompletionEntry(context, rule, token, index);
    if (!nextToken) continue;
    result.push(nextToken);
    index++;
  }
  return result;
}

function createCompletionEntry(
  context: TemplateContext,
  rule: ParsedCompletionRule,
  completion: CompletionToken,
  sortedIndex: number,
): ts.CompletionEntry | null {
  let name = completion.name;
  let insertText: string | undefined;
  let replacementSpan: ts.TextSpan | undefined = {
    start: context.toOffset(context.toPosition(rule.loc.start)),
    length:
      context.toOffset(context.toPosition(rule.loc.end)) -
      context.toOffset(context.toPosition(rule.loc.start)),
  };
  if (rule.prefix != '') {
    if (name.startsWith(rule.name)) {
      name = completion.name.slice(rule.prefix.length);
      replacementSpan = undefined;
      if (name.startsWith('-')) {
        name = name.slice(1);
      }
    } else {
      return null;
    }
  }
  if (rule.prefix == '') {
    if ((rule.name != '' || rule.raw != '') && !completion.name.startsWith(rule.name)) {
      return null;
    }
    replacementSpan = undefined;
    // insertText = completion.name.slice(rule.raw.length);
    name = completion.name;
  }
  return {
    kind: getCompletionTokenKind(completion),
    kindModifiers: getKindModifiers(completion),
    name,
    sourceDisplay: [
      {
        kind: 'color',
        text:
          completion.kind == 'class' && completion.themeValue
            ? `${completion.property}: ${completion.themeValue}`
            : '',
      },
    ],
    sortText: sortedIndex.toString().padStart(8, '0'),
    insertText,
    replacementSpan,
  };
}

export function getCompletionTokenKind(completion: CompletionToken): ts.ScriptElementKind {
  if (completion.kind == 'variant') {
    return ts.ScriptElementKind.moduleElement;
  }
  if (completion.isColor) return ts.ScriptElementKind.primitiveType;
  return ts.ScriptElementKind.string;
}

function getKindModifiers(item: CompletionToken): string {
  if (item.kind == 'variant') return '';
  if (item.isColor) {
    return 'color';
  }

  return '';
}

export function getDocumentation(data: ClassCompletionToken, tw: RuntimeTW) {
  if (!data.property || !data.themeValue) return '';
  const result: string[] = [];
  // result.push('***Css Rules*** \n\n');
  // result.push(`${'```css\n'}${data.css}${'\n```'}`);
  // result.push('\n\n');
  const resolver = tw(data.name);
  debugLog(
    {
      symbol: '📗',
      msg: `____DATA_____`,
      value: resolver,
    },
    true,
  );
  const prop = resolver.reduce(
    (prev, current) => {
      current.declarations.forEach((x) => {
        prev[x.prop] = x.value;
      });
      return {
        ...prev,
      };
    },
    {} as Record<string, any>,
  );
  result.push('***React Native StyleSheet*** \n\n');
  result.push(`${'```json\n'}${JSON.stringify(prop, null, 2)}${'\n```'}`);
  return result.join('\n\n');
}

export function getCompletionEntryDetailsDisplayParts(
  suggestion: ClassCompletionToken,
): ts.SymbolDisplayPart[] {
  if (
    suggestion.isColor &&
    suggestion.themeValue &&
    (suggestion.themeValue.startsWith('#') || suggestion.themeValue.startsWith('rgb'))
  ) {
    const hex = new TinyColor(suggestion.themeValue);
    if (hex.isValid) {
      return [
        {
          kind: 'color',
          text: hex.toHexString(),
        },
      ];
    }
  }
  return [];
}

export function createCompletionEntryDetails(
  item: ClassCompletionToken,
  twRuntime: RuntimeTW,
): ts.CompletionEntryDetails {
  const displayParts = getCompletionEntryDetailsDisplayParts(item);
  return {
    name: item.name,
    kind: ts.ScriptElementKind.string,
    kindModifiers: displayParts.length > 0 ? 'color' : '',
    displayParts,
    documentation: [
      {
        kind: vscode.MarkupKind.Markdown,
        text: getDocumentation(item, twRuntime),
      },
    ],
  };
}
