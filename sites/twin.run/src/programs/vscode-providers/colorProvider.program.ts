import { TwinTextDocument } from '@/editor/models/TwinTextDocument.model';
import { getColorDecoration } from '@/utils/languageClient.utils';
import { type Numberify, type RGBA, TinyColor } from '@ctrl/tinycolor';
import { CSS_COLORS } from '@native-twin/css';
import {
  Constants,
  DocumentLanguageRegion,
  NativeTwinManagerService,
  type TemplateTokenData,
  type TwinRuleCompletion,
} from '@native-twin/language-service/browser';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import * as vscode from 'vscode';

const colorNames = Object.keys(CSS_COLORS);
export const InstallColorProvider = Effect.gen(function* () {
  const twinService = yield* NativeTwinManagerService;
  const colorDecorations = yield* Effect.cachedFunction((_: number) =>
    Effect.sync(() => getColorDecoration()),
  );
  const colorDecoration = yield* colorDecorations(0);
  vscode.languages.registerColorProvider(Constants.DOCUMENT_SELECTORS, {
    provideColorPresentations(_color, _context, _token) {
      return [];
    },
    provideDocumentColors: async (document, _token) => {
      const twinDocument = new TwinTextDocument(document);
      const documentColors = pipe(
        twinDocument.getLanguageRegions(Constants.DEFAULT_PLUGIN_CONFIG),
        RA.map((region) => twinDocument.babelLocationToVscode(region)),
        RA.map(
          (region) =>
            new DocumentLanguageRegion(
              region.range,
              region.offset.start,
              region.offset.end,
              region.text,
            ),
        ),
        RA.flatMap((x) => x.regionNodes),
        RA.flatMap((x) => x.flattenToken),
        RA.dedupe,
        RA.flatMap((x) => templateTokenToColorInfo(x, twinService, twinDocument)),
      );

      const editableColors = documentColors.filter((color) => {
        const text =
          vscode.workspace.textDocuments
            .find((doc) => doc === document)
            ?.getText(color.range) ?? '';
        return new RegExp(
          `-\\[(${colorNames.join('|')}|((?:#|rgba?\\(|hsla?\\())[^\\]]+)\\]$`,
        ).test(text);
      });

      const nonEditableColors = documentColors.filter(
        (color) => !editableColors.includes(color),
      );

      const editors = vscode.window.visibleTextEditors.filter(
        (editor) => editor.document === document,
      );

      for (const editor of editors) {
        editor.setDecorations(
          colorDecoration,
          nonEditableColors.map(({ color, range }) => ({
            range: range,
            renderOptions: {
              before: {
                backgroundColor: `rgba(${color.red * 255}, ${color.green * 255}, ${color.blue * 255}, ${color.alpha})`,
              },
            },
          })),
        );
      }

      return editableColors;
    },
  });
});

/** File private */
export const templateTokenToColorInfo = (
  templateNode: TemplateTokenData,
  twinService: NativeTwinManagerService['Type'],
  twinDocument: TwinTextDocument,
): vscode.ColorInformation[] => {
  const range = new vscode.Range(
    twinDocument.document.positionAt(templateNode.token.bodyLoc.start),
    twinDocument.document.positionAt(templateNode.token.bodyLoc.end),
  );
  const templateFilter = templateNode.adjustColorInfo(range);
  return twinService.completions.twinRules.pipe(
    RA.fromIterable,
    RA.filterMap((y) =>
      y.completion.className === templateFilter.className
        ? Option.some(y)
        : Option.none(),
    ),
    RA.filter((x) => x.rule.themeSection === 'colors'),
    RA.map((x) => completionRuleToColorInfo(x, range)),
  );
};

/** File private */
const completionRuleToColorInfo = (
  rule: TwinRuleCompletion,
  range: vscode.Range,
): vscode.ColorInformation => ({
  range: range,
  color: toVsCodeColor(new TinyColor(rule.completion.declarationValue).toRgb()),
});

/** File private */
const toVsCodeColor = (color: Numberify<RGBA>): vscode.Color =>
  new vscode.Color(color.r / 255, color.g / 255, color.b / 255, color.a);
