import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import * as vscodeLSP from 'vscode-languageserver-protocol';
import { asArray } from '@native-twin/helpers';
import { DocumentLanguageRegion } from '../models/documents/LanguageRegion.model';
import { BaseTwinTextDocument } from '../models/documents/BaseTwinDocument';
import {
  TwinDiagnosticCodes,
  VscodeDiagnosticItem,
} from '../models/language/diagnostic.model';
import { LSPDocumentsService } from '../services/LSPDocuments.service';
import { diagnosticProviderSource } from '../utils/constants.utils';

export const twinCodeActionsProgram = (params: vscodeLSP.CodeActionParams) => {
  return Effect.gen(function* () {
    const docHandler = yield* LSPDocumentsService;
    if (params.context.diagnostics.length === 0) return undefined;

    const document = yield* docHandler
      .getDocument(params.textDocument.uri)
      .pipe(Effect.map(Option.getOrUndefined));

    if (!document) return undefined;

    const diagnostics = RA.filterMap(params.context.diagnostics, (x) => {
      if (!x.code || !x.relatedInformation || !x.source || !x.severity) {
        return Option.none();
      }

      if (x.source !== diagnosticProviderSource) return Option.none();

      return Option.some(
        new VscodeDiagnosticItem({
          code: x.code as TwinDiagnosticCodes,
          relatedInfo: x.relatedInformation,
          text: x.message,
          message: x.message,
          entries: [],
          uri: document.uri,
          range: x.range,
        }),
      );
    });
    // const startOffset = document.positionToOffset(params.range.start);
    // const endOffset = document.positionToOffset(params.range.start);

    const editsForDuplicatedDeclarations: vscodeLSP.CodeAction[] = pipe(
      Option.map(document.getTemplateAtPosition(params.range.start), (region) =>
        getDuplicatedDeclarationCodeAction(
          document,
          region,
          RA.filter(
            diagnostics,
            (x) => x.code === TwinDiagnosticCodes.DuplicatedDeclaration,
          ),
        ),
      ),
      Option.getOrElse(() => []),
    );

    return [...editsForDuplicatedDeclarations];
  });
};

const getDuplicatedDeclarationCodeAction = (
  twinDoc: BaseTwinTextDocument,
  region: DocumentLanguageRegion,
  diagnostics: VscodeDiagnosticItem[],
) => {
  const textsToRemove = pipe(
    RA.flatMap(diagnostics, (x) =>
      RA.map(x.relatedInformation, diagnosticRelatedInfoToEdit),
    ),
    RA.map((info) => twinDoc.getText(info.textEdit.range)),
  );

  let newText = region.text;
  for (const edit of textsToRemove) {
    newText = newText.replace(edit, '');
  }
  newText = newText.replaceAll(/\s+/g, ' ');
  const fix = vscodeLSP.CodeAction.create(
    `Remove duplicated utilities`,
    vscodeLSP.CodeActionKind.QuickFix,
  );

  fix.edit = {
    changes: {
      [twinDoc.uri]: asArray(vscodeLSP.TextEdit.replace(region.range, newText)),
    },
  };
  fix.isPreferred = true;
  fix.diagnostics = diagnostics;
  return asArray(fix);
};

const diagnosticRelatedInfoToEdit = (item: vscodeLSP.DiagnosticRelatedInformation) => {
  return {
    textEdit: vscodeLSP.TextEdit.replace(item.location.range, ''),
    message: item.message,
  };
};

// const getActionsForDuplicatedDecl = (
//   diagnosticItem: VscodeDiagnosticItem,
//   uri: string,
//   // region: DocumentLanguageRegion,
// ): vscodeLSP.CodeAction => {
//   const textEdits = RA.map(
//     diagnosticItem.relatedInformation,
//     diagnosticRelatedInfoToEdit,
//   );

//   const fix = vscodeLSP.CodeAction.create(
//     `Remove duplicated utilities`,
//     {
//       changes: {
//         [uri]: RA.map(textEdits, (x) => x.textEdit),
//       },
//     },
//     vscodeLSP.CodeActionKind.QuickFix,
//   );
//   fix.isPreferred = true;
//   return fix;
// };
