import type * as vscode from 'vscode-languageserver-types';

export const isSameRange = (range1: vscode.Range, range2: vscode.Range) => {
  return (
    range1.start.line === range2.start.line &&
    range1.start.character === range2.start.character
  );
};
