import * as vscode from 'vscode-languageserver-types';
import type { BaseTwinTextDocument } from '../models/documents/BaseTwinDocument.js';
import type { DocumentLanguageRegion } from '../models/documents/LanguageRegion.model.js';

export const documentLanguageRegionToRange = (
  x: DocumentLanguageRegion,
  document: BaseTwinTextDocument,
) => {
  const range = vscode.Range.create(
    document.positionAt(x.startOffset),
    document.positionAt(x.endOffset),
  );
  return {
    range,
    text: document.getText(range),
  };
};
