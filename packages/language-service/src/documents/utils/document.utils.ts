import * as vscode from 'vscode-languageserver-types';
import type { DocumentLanguageRegion } from '../models/language-region.model';
import type { TwinLSPDocument } from '../models/twin-document.model';

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
