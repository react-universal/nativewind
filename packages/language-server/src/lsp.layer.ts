import * as Layer from 'effect/Layer';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as vscode from 'vscode-languageserver/node';
import {
  LSPConnectionService,
  LSPDocumentsService,
  NativeTwinManagerService,
  LSPConfigService
} from '@native-twin/language-service';
import { LoggerLive } from './services/logger.service';

const documentsHandler = new vscode.TextDocuments(TextDocument);
const connectionHandler = vscode.createConnection();

export const LspMainLive = LoggerLive.pipe(
  Layer.provideMerge(LSPDocumentsService.make(documentsHandler)),
  Layer.provideMerge(LSPConfigService.Live),
  Layer.provideMerge(NativeTwinManagerService.Live),
  Layer.provideMerge(LSPConnectionService.make(connectionHandler)),
);
