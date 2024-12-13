import { type Numberify, type RGBA, TinyColor } from '@ctrl/tinycolor';
import * as ReadonlyArray from 'effect/Array';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import type * as vscode from 'vscode-languageserver';
import { Color, Range } from 'vscode-languageserver-types';
import type { BaseTwinTextDocument } from '../../models/documents/BaseTwinDocument.js';
import type { TwinRuleCompletion } from '../../models/twin/native-twin.types.js';
import type { TemplateTokenData } from '../../models/twin/template-token.model.js';
import type { NativeTwinManagerService } from '../../services/NativeTwinManager.service.js';

export const getDocumentTemplatesColors = (
  twinService: NativeTwinManagerService['Type'],
  twinDocument: BaseTwinTextDocument,
) =>
  pipe(
    twinDocument.getLanguageRegions(),
    ReadonlyArray.flatMap((template) => template.regionNodes),
    ReadonlyArray.flatMap((x) => x.flattenToken),
    ReadonlyArray.dedupe,
    ReadonlyArray.flatMap((x) => templateTokenToColorInfo(x, twinService, twinDocument)),
  );

/** File private */
export const templateTokenToColorInfo = (
  templateNode: TemplateTokenData,
  twinService: NativeTwinManagerService['Type'],
  twinDocument: BaseTwinTextDocument,
): vscode.ColorInformation[] => {
  const range = Range.create(
    twinDocument.positionAt(templateNode.token.bodyLoc.start),
    twinDocument.positionAt(templateNode.token.bodyLoc.end),
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
