import * as Layer from 'effect/Layer';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as vscode from 'vscode-languageserver/node';
import {
  ConfigManagerService,
  ConnectionService,
  DocumentsService,
  LanguageServiceLive,
} from '@native-twin/language-service';
import { LoggerLive } from './services/logger.service';

const documentsHandler = new vscode.TextDocuments(TextDocument);
const connectionHandler = vscode.createConnection();

const vscodeLive = LoggerLive.pipe(
  Layer.provideMerge(ConnectionService.make(connectionHandler)),
)
  .pipe(Layer.provideMerge(DocumentsService.make(documentsHandler)))
  .pipe(Layer.provideMerge(ConfigManagerService.Live));

export const LspMainLive = vscodeLive.pipe(
  Layer.provideMerge(LanguageServiceLive),
  Layer.provideMerge(vscodeLive),
);
