import * as Layer from 'effect/Layer';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as vscode from 'vscode-languageserver/node';
import {
  ConfigManagerService,
  ConnectionService,
  DocumentsService,
  NativeTwinManagerService,
} from '@native-twin/language-service';
import { LoggerLive } from './services/logger.service';

const documentsHandler = new vscode.TextDocuments(TextDocument);
const connectionHandler = vscode.createConnection();

export const LspMainLive = LoggerLive.pipe(
  Layer.provideMerge(ConnectionService.make(connectionHandler)),
  Layer.provideMerge(DocumentsService.make(documentsHandler)),
  Layer.provideMerge(ConfigManagerService.Live),
  Layer.provideMerge(NativeTwinManagerService.Live),
);
