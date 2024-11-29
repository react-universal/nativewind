import { TextDocument } from 'vscode-languageserver-textdocument';
import * as vscode from 'vscode-languageserver/node.js';
import * as Layer from 'effect/Layer';
import {
  LSPConnectionService,
  LSPDocumentsService,
  NativeTwinManagerService,
  LSPConfigService,
  TwinLSPDocument,
  NativeTwinManager,
} from '@native-twin/language-service';
import { LoggerLive } from './services/logger.service.js';

const documentsHandler = new vscode.TextDocuments(TextDocument);
const connectionHandler = vscode.createConnection();

export const LspMainLive = LoggerLive.pipe(
  Layer.provideMerge(LSPDocumentsService.make(documentsHandler, TwinLSPDocument)),
  Layer.provideMerge(LSPConfigService.Live),
  Layer.provideMerge(NativeTwinManagerService.Live(new NativeTwinManager())),
  Layer.provideMerge(LSPConnectionService.make(connectionHandler)),
);
