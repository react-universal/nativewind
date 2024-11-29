import * as vscode from 'vscode';
import { positionToLocation } from './helpers.js';
import { TestDocument } from './models/TestDocument.model.js';

interface FixtureParams {
  document: TestDocument;
  text: string;
  position: vscode.Position;
}

export interface Fixture {
  location: vscode.Location;
  document: TestDocument;
  text: string;
  position: vscode.Position;
}

export const createFixture = async (params: FixtureParams): Promise<Fixture> => {
  const { document, text, position } = params;
  await document.editContent(text);
  const location = positionToLocation(document.uri, position);
  await document.moveCursor(location);
  return {
    ...params,
    location,
  };
};
