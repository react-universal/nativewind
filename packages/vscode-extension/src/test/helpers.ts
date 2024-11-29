import * as vscode from 'vscode';
import { extensionContext } from './models/ExtensionTest.model.js';

export async function startTestFile(path: string) {
  const api = await extensionContext.setup();

  const requestHandler = api.onRequest('nativeTwinInitialized', (x) => {
    console.log('SERVER_RUNNING_MODE:', x);
    extensionContext.running = true;
  });

  const docHandler = extensionContext.openTextDocument(path);
  console.log('Activating server...');

  await docHandler.open();

  await checkExtensionActive();
  requestHandler.dispose();
  return docHandler;
}

async function checkExtensionActive() {
  if (!extensionContext.running) {
    await sleep(1000);
    return checkExtensionActive();
  }
  console.log('RUNNING');
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const positionToLocation = (
  docURI: vscode.Uri,
  position: vscode.Position,
): vscode.Location => new vscode.Location(docURI, position);
