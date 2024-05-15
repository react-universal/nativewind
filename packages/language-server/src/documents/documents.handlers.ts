import * as Effect from 'effect/Effect';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as vscode from 'vscode-languageserver/node';
import { ConnectionService } from '../connection/connection.service';

export const configurationSection = 'nativeTwin';

export function getDocumentSettings(resource: string) {
  return Effect.gen(function* ($) {
    const Connection = yield* $(ConnectionService);
    const result = yield* $(
      Effect.promise(() =>
        Connection.workspace.getConfiguration({
          scopeUri: resource,
          section: configurationSection,
        }),
      ),
    );
    return result;
  });
}

export function validateTextDocument(textDocument: TextDocument) {
  return Effect.gen(function* ($) {
    const settings = yield* $(getDocumentSettings(textDocument.uri));

    // The validator creates diagnostics for all uppercase words length 2 and more
    const text = textDocument.getText();
    const pattern = /\b[A-Z]{2,}\b/g;
    let m: RegExpExecArray | null;

    let problems = 0;
    const diagnostics: vscode.Diagnostic[] = [];

    while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
      problems++;
      const diagnostic: vscode.Diagnostic = {
        severity: vscode.DiagnosticSeverity.Warning,
        range: {
          start: textDocument.positionAt(m.index),
          end: textDocument.positionAt(m.index + m[0].length),
        },
        message: `${m[0]} is all uppercase.`,
        source: 'ex',
      };
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: 'Spelling matters',
        },
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: 'Particularly for names',
        },
      ];
      diagnostics.push(diagnostic);
    }
    return diagnostics;
  });
}