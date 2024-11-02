import * as Data from 'effect/Data';
import * as vscode from 'vscode';

interface CompletionsInput {
  _tag: 'CompletionsInput';
  document: vscode.TextDocument;
  position: vscode.Position;
}
export const CompletionsInput = Data.tagged<CompletionsInput>('CompletionsInput');
