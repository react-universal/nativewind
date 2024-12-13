import path from 'path';
import { Constants } from '@native-twin/language-service';
import * as vscode from 'vscode';
import type { LanguageClient } from 'vscode-languageclient/node.js';
import { TestDocument } from './TestDocument.model.js';

class ExtensionTestHandler {
  readonly extensionName = Constants.extensionName;
  readonly extension: vscode.Extension<LanguageClient>;
  running = false;

  constructor() {
    const ext = vscode.extensions.getExtension(this.extensionName);
    if (!ext) {
      throw new Error(`Extension ${this.extensionName} not found`);
    }
    this.extension = ext;
  }

  openTextDocument(uri: string) {
    return new TestDocument(this.getDocUri(uri));
  }

  async setup() {
    return this.extension.activate();
  }

  getDocUri(p: string) {
    return vscode.Uri.file(this.getDocPath(p));
  }

  private getDocPath(p: string) {
    return path.resolve(__dirname, '../../../project-fixture', p);
  }
}

export const extensionContext = new ExtensionTestHandler();
