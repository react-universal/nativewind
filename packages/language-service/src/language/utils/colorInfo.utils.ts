import { Numberify, RGBA, TinyColor } from '@ctrl/tinycolor';
import * as ReadonlyArray from 'effect/Array';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import type * as vscode from 'vscode-languageserver';
import { Range, Color } from 'vscode-languageserver-types';
import { TwinLSPDocument } from '../../documents/models/twin-document.model';
import { TemplateTokenData } from '../../native-twin/models/template-token.model';
import { NativeTwinManager } from '../../native-twin/native-twin.service';
import { TwinRuleCompletion } from '../../native-twin/native-twin.types';

export const getDocumentTemplatesColors = (
  twinService: NativeTwinManager,
  twinDocument: TwinLSPDocument,
) =>
  pipe(
    twinDocument.getLanguageRegions(),
    ReadonlyArray.flatMap((template) => template.regionNodes),
    ReadonlyArray.flatMap((x) => x.flattenToken),
    ReadonlyArray.dedupe,
    ReadonlyArray.flatMap((x) => templateTokenToColorInfo(x, twinService, twinDocument)),
  );

/** File private */
const templateTokenToColorInfo = (
  templateNode: TemplateTokenData,
  twinService: NativeTwinManager,
  twinDocument: TwinLSPDocument,
): vscode.ColorInformation[] => {
  const range = Range.create(
    twinDocument.offsetToPosition(templateNode.token.bodyLoc.start),
    twinDocument.offsetToPosition(templateNode.token.bodyLoc.end),
  );
  const templateFilter = templateNode.adjustColorInfo(range);
  return twinService.completions.twinRules.pipe(
    ReadonlyArray.fromIterable,
    ReadonlyArray.filterMap((y) =>
      y.completion.className === templateFilter.className
        ? Option.some(y)
        : Option.none(),
    ),
    ReadonlyArray.filter((x) => x.rule.themeSection === 'colors'),
    ReadonlyArray.map(
      (x): vscode.ColorInformation => completionRuleToColorInfo(x, range),
    ),
  );
};

/** File private */
const completionRuleToColorInfo = (rule: TwinRuleCompletion, range: vscode.Range) => ({
  range: range,
  color: toVsCodeColor(new TinyColor(rule.completion.declarationValue).toRgb()),
});

/** File private */
const toVsCodeColor = (color: Numberify<RGBA>): vscode.Color =>
  Color.create(color.r / 255, color.g / 255, color.b / 255, color.a);
