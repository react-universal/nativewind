import * as vscode from 'vscode-languageserver-types';
import type { DocumentLanguageRegion } from '../models/documents/LanguageRegion.model';
import type { TwinLSPDocument } from '../models/documents/TwinLSPDocument.model';

export const documentLanguageRegionToRange = (
  x: DocumentLanguageRegion,
  document: TwinLSPDocument,
) => {
  const range = vscode.Range.create(
    document.offsetToPosition(x.startOffset),
    document.offsetToPosition(x.endOffset),
  );
  return {
    range,
    text: document.getText(range),
  };
};
