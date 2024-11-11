import { FinalSheet } from '@native-twin/css';
import { TinyColor } from '@ctrl/tinycolor';
import toCssFormat from 'cssbeautify';
import * as ReadonlyArray from 'effect/Array';
import { pipe } from 'effect/Function';
import * as vscode from 'vscode-languageserver-types';
import { asArray } from '@native-twin/helpers';
import { DocumentLanguageRegion } from '../../documents/models/language-region.model';
import { TwinLSPDocument } from '../../documents/models/twin-document.model';
import {
  TemplateTokenData,
  TemplateTokenWithText,
} from '../../native-twin/models/template-token.model';
import { TwinRuleCompletion, TwinRuleParts } from '../../native-twin/native-twin.types';
import { variantTokenToString } from '../../native-twin/utils/native-twin.utils';

export const getCompletionTokenKind = ({
  rule,
}: TwinRuleCompletion): vscode.CompletionItemKind =>
  rule.themeSection == 'colors'
    ? vscode.CompletionItemKind.Color
    : vscode.CompletionItemKind.Constant;

export const getKindModifiers = (item: TwinRuleParts): string =>
  item.meta.feature === 'colors' || item.themeSection === 'colors' ? 'color' : '';

export function getCompletionEntryDetailsDisplayParts({
  rule,
  completion,
}: TwinRuleCompletion) {
  if (rule.meta.feature === 'colors' || rule.themeSection === 'colors') {
    const hex = new TinyColor(completion.declarationValue);
    if (hex.isValid) {
      return {
        kind: 'color',
        text: hex.toHexString(),
      };
    }
    return {
      kind: 'color',
      text: completion.declarationValue,
    };
  }
  return undefined;
}

export const getFlattenTemplateToken = (
  item: TemplateTokenWithText,
  base: TemplateTokenWithText | null = null,
): TemplateTokenData[] => {
  if (
    item.token.type === 'CLASS_NAME' ||
    item.token.type === 'ARBITRARY' ||
    item.token.type === 'VARIANT_CLASS' ||
    item.token.type === 'VARIANT'
  ) {
    if (!base) return asArray(new TemplateTokenData(item, base));

    if (base.token.type === 'VARIANT') {
      const className = `${base.token.value.map((x) => x.n).join(':')}:${item.text}`;
      return asArray(
        new TemplateTokenData(
          new TemplateTokenWithText(item.token, className, item.templateStarts),
          base,
        ),
      );
    }

    if (base.token.type === 'CLASS_NAME') {
      if (item.token.type === 'CLASS_NAME') {
        return asArray(
          new TemplateTokenData(
            new TemplateTokenWithText(
              item.token,
              `${base.token.value.n}-${item.text}`,
              item.templateStarts,
            ),
            base,
          ),
        );
      }

      // if (item.token.type === 'VARIANT') {
      //   console.log(base, item);
      // }

      if (item.token.type === 'VARIANT_CLASS') {
        const className = `${variantTokenToString(item.token)}${base.token.value.n}-${item.token.value[1].value.n}`;
        return asArray(
          new TemplateTokenData(
            new TemplateTokenWithText(item.token, className, item.templateStarts),
            base,
          ),
        );
      }
    }
  }

  if (item.token.type === 'GROUP') {
    const base = item.token.value.base;
    const classNames = item.token.value.content.flatMap((x) =>
      getFlattenTemplateToken(x, base),
    );
    return classNames;
  }

  return [];
};

export const getRangeFromTokensAtPosition = (
  document: TwinLSPDocument,
  nodeAtPosition: DocumentLanguageRegion,
  templateTokens: TemplateTokenWithText[],
) => {
  return pipe(
    templateTokens,
    ReadonlyArray.map((completion) =>
      document.getRangeAtPosition(completion, nodeAtPosition.range),
    ),
  );
};

export function getDocumentationMarkdown(sheetEntry: FinalSheet, css: string) {
  const result: string[] = [];
  result.push('***Css Rules*** \n\n');
  result.push(
    `${'```css\n'}${toCssFormat(css, {
      indent: `\t`,
      openbrace: 'end-of-line',
      autosemicolon: true,
    })}${'\n```'}`,
  );
  result.push('\n\n');
  result.push('#### React Native StyleSheet\n');
  const rnSheet = Object.entries(sheetEntry).filter((x) => Object.keys(x[1]).length > 0);
  result.push(createJSONMarkdownString(Object.fromEntries(rnSheet)));
  // result.push(createDebugHover(completionRule));
  return result.join('\n');
}

const createJSONMarkdownString = <T extends object>(x: T) =>
  ['```json', JSON.stringify(x, null, 2), '```'].join('\n');

export function createDebugHover(rule: TwinRuleCompletion) {
  const result: string[] = [];
  result.push('********************************************\n');
  result.push('#### Debug Info');

  result.push('##### Completion:');
  result.push(`${'```json\n'}${JSON.stringify(rule.completion, null, 2)}${'\n```'}`);
  result.push('********************************************\n');

  result.push('##### Compositions:');
  result.push(`${'```json\n'}${JSON.stringify(rule.composition, null, 2)}${'\n```'}`);
  result.push('********************************************\n');

  result.push('##### Rule:');
  result.push(`${'```json\n'}${JSON.stringify(rule.rule, null, 2)}${'\n```'}`);
  result.push('********************************************\n');

  return result.join('\n\n');
}
