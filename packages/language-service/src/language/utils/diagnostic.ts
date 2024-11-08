import * as ReadOnlyArray from 'effect/Array';
import { flip, pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import * as Record from 'effect/Record';
import * as vscode from 'vscode-languageserver-types';
import { TwinLSPDocument } from '../../documents/models/twin-document.model';
import { TwinSheetEntry } from '../../native-twin/models/TwinSheetEntry.model';
import { TemplateTokenWithText } from '../../native-twin/models/template-token.model';
import { NativeTwinManagerService } from '../../native-twin/native-twin.service';
import { isSameRange } from '../../utils/vscode.utils';
import { DIAGNOSTIC_ERROR_KIND, VscodeDiagnosticItem } from '../models/diagnostic.model';

const createRegionEntriesExtractor =
  (entry: TwinSheetEntry, getRange: ReturnType<typeof bodyLocToRange>, uri: string) =>
  () => {
    return ReadOnlyArray.filterMap(
      (x: TwinSheetEntry): Option.Option<DiagnosticToken> => {
        if (isSameClassName(entry, x)) {
          return Option.some({
            kind: 'DUPLICATED_CLASS_NAME',
            node: x,
            range: getRange(x.token.bodyLoc),
            uri: uri,
          });
        }
        if (isSameDeclarationProp(entry, x)) {
          return Option.some({
            kind: 'DUPLICATED_DECLARATION',
            node: x,
            range: getRange(x.token.bodyLoc),
            uri: uri,
          });
        }
        return Option.none();
      },
    );
  };

export const diagnosticTokensToDiagnosticItems = (
  document: TwinLSPDocument,
  twinService: NativeTwinManagerService['Type'],
): VscodeDiagnosticItem[] => {
  const getRange = bodyLocToRange(document);
  return pipe(
    document.getLanguageRegions(),
    ReadOnlyArray.flatMap((region) => {
      const regionEntries = region.getFullSheetEntries(twinService.tw);
      const generateExtractor = flip(createRegionEntriesExtractor)();
      return pipe(
        regionEntries,
        ReadOnlyArray.map((regionNode) => {
          const range = getRange(regionNode.token.bodyLoc);
          const duplicates = generateExtractor(
            regionNode,
            getRange,
            document.uri,
          )(regionEntries);

          if (duplicates.length < 1) return [];
          const relatedInfo = regionDescriptions(duplicates, document.uri);
          return pipe(
            duplicates,
            ReadOnlyArray.filter((x) => !isSameRange(x.range, range)),
            ReadOnlyArray.map(
              ({ kind, node }) =>
                new VscodeDiagnosticItem({
                  range,
                  kind: kind,
                  entries: [node],
                  uri: document.uri,
                  text: node.token.text,
                  relatedInfo: relatedInfo.filter((x) => x.kind === kind),
                }),
            ),
            ReadOnlyArray.filterMap((x) => (x === null ? Option.none() : Option.some(x))),
          );
        }),
      );
    }),
    ReadOnlyArray.flatten,
    ReadOnlyArray.dedupe,
  );
};

interface DiagnosticToken {
  kind: keyof typeof DIAGNOSTIC_ERROR_KIND;
  node: TwinSheetEntry;
  range: vscode.Range;
  uri: string;
}

export const diagnosticTokenToVscode = (
  { range, kind, node, uri }: DiagnosticToken,
  relatedInfo: vscode.DiagnosticRelatedInformation[],
) => {
  return new VscodeDiagnosticItem({
    range,
    kind: kind,
    entries: [node],
    uri: uri,
    text: node.token.text,
    relatedInfo: relatedInfo,
  });
};

export const regionDescriptions = (data: DiagnosticToken[], uri: string) => {
  return pipe(
    data,
    ReadOnlyArray.map((x) => {
      return {
        kind: x.kind,
        location: vscode.Location.create(uri, x.range),
        message: x.node.entry.className,
      };
    }),
  );
};

export const bodyLocToRange =
  (document: TwinLSPDocument) => (bodyLoc: TemplateTokenWithText['bodyLoc']) =>
    vscode.Range.create(
      document.offsetToPosition(bodyLoc.start),
      document.offsetToPosition(bodyLoc.end),
    );

export const isSameClassName = (a: TwinSheetEntry, b: TwinSheetEntry) =>
  a.entry.className === b.entry.className;

const isSameDeclarationProp = (a: TwinSheetEntry, b: TwinSheetEntry) =>
  a.declarationProp === b.declarationProp && a.selector === b.selector;

export const getEntriesDuplicates = <A extends string>(
  entries: TwinSheetEntry[],
  by: (x: TwinSheetEntry) => A,
) =>
  pipe(
    ReadOnlyArray.groupBy(entries, by),
    Record.filter((x) => x.length > 1),
    Record.values,
    ReadOnlyArray.flatten,
  );
