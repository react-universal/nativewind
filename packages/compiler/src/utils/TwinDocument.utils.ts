import type { SourceLocation } from '@babel/types';
import type { Position, Range, TextDocument } from 'vscode-languageserver-textdocument';

const quotesRegex = /^['"`].*['"`]$/g;

export function babelLocationToRange(
  location: SourceLocation,
  document: TextDocument,
): Range {
  const startPosition: Position = {
    line: location.start.line,
    character: location.start.column,
  };
  const endPosition: Position = {
    line: location.end.line,
    character: location.end.column,
  };

  const range: Range = {
    start: startPosition,
    end: endPosition,
  };
  const text = document.getText(range);

  if (quotesRegex.test(text)) {
    range.start.character += 1;
    range.end.character -= 1;
    return { ...range };
  }
  return range;
}
