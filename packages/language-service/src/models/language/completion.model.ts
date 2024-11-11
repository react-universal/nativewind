import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';
import * as vscode from 'vscode-languageserver-types';
import {
  getCompletionEntryDetailsDisplayParts,
  getCompletionTokenKind,
} from '../../language/utils/language.utils';
import { TwinRuleCompletion, TwinVariantCompletion } from '../../native-twin/native-twin.types';

export class VscodeCompletionItem implements vscode.CompletionItem, Equal.Equal {
  label: string;
  readonly kind: vscode.CompletionItemKind;
  readonly filterText: string;
  readonly sortText: string;
  readonly detail: string | undefined;
  readonly labelDetails: vscode.CompletionItemLabelDetails;
  insertText: string;
  readonly insertTextFormat: vscode.InsertTextFormat;
  textEditText: string;
  readonly textEdit: vscode.TextEdit;

  constructor(
    data: TwinRuleCompletion | TwinVariantCompletion,
    range: vscode.Range,
    insertText: string,
  ) {
    if (data.kind === 'rule') {
      const { completion, order } = data;
      this.label = completion.className;
      this.kind = getCompletionTokenKind(data);
      this.filterText = completion.className;
      this.sortText = order.toString().padStart(8, '0');
      this.detail = getCompletionEntryDetailsDisplayParts(data)?.text;
      this.labelDetails = {
        description: completion.declarations.join(','),
      };
      this.insertText = insertText;
      this.insertTextFormat = 2;
      this.textEditText = completion.className;
      this.textEdit = {
        newText: insertText,
        range,
      };
    } else {
      const { name, index } = data;
      this.kind = vscode.CompletionItemKind.Constant;
      this.filterText = name;
      this.label = name;
      this.sortText = index.toString().padStart(8, '0');
      this.detail = undefined;
      this.labelDetails = {
        description: '',
      };
      this.insertText = insertText;
      this.insertTextFormat = 2;
      this.textEditText = name;
      this.textEdit = {
        newText: insertText,
        range,
      };
    }
  }

  [Equal.symbol](that: unknown): boolean {
    return (
      that instanceof VscodeCompletionItem &&
      this.label === that.label &&
      this.textEditText === that.textEditText &&
      this.sortText === that.sortText &&
      this.textEdit === that.textEdit
    );
  }

  [Hash.symbol](): number {
    return Hash.array([this.label, this.textEdit.newText, this.textEdit.newText]);
  }
}
