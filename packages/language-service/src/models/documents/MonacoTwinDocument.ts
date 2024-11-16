import * as vscode from 'vscode';
import * as VSCDocument from 'vscode-languageserver-textdocument';
import * as t from '@babel/types';
import * as RA from 'effect/Array';
import * as Data from 'effect/Data';
import * as Option from 'effect/Option';
import { extractLanguageRegions } from '../../utils/babel/extractLanguageRegions.web';
import { type NativeTwinPluginConfiguration } from '../../utils/constants.utils';
import { BaseTwinTextDocument } from './BaseTwinDocument';
import { DocumentLanguageRegion } from './LanguageRegion.model';

interface TwinTokenLocation {
  _tag: 'TwinTokenLocation';
  range: vscode.Range;
  offset: {
    start: number;
    end: number;
  };
  text: string;
}

export const TwinTokenLocation = Data.tagged<TwinTokenLocation>('TwinTokenLocation');

export class TwinMonacoTextDocument extends BaseTwinTextDocument {
  constructor(document: VSCDocument.TextDocument, config: NativeTwinPluginConfiguration) {
    super(
      VSCDocument.TextDocument.create(
        document.uri.toString(),
        document.languageId,
        document.version,
        document.getText(),
      ),
      config,
    );
  }

  getTemplateAtPosition(position: VSCDocument.Position) {
    const positionOffset = this.offsetAt(position);
    return Option.fromNullable(
      this.getLanguageRegions().find(
        (x) => positionOffset >= x.startOffset && positionOffset <= x.endOffset,
      ),
    );
  }

  getLanguageRegions() {
    const regions = extractLanguageRegions(this.getText(), this.config);
    return RA.map(regions, (x) => this.getRegionAt(x));
  }

  findTokenLocationAt(position: vscode.Position) {
    const regions = this.getLanguageRegions();
    const positionOffset = this.offsetAt(position);
    return RA.findFirst(regions, (x) =>
      this.isPositionAtOffset({ end: x.endOffset, start: x.startOffset }, positionOffset),
    );
  }

  // MARK: Private methods
  private getRegionAt(location: t.SourceLocation) {
    let range = this.babelLocationToRange(location);
    const text = this.getText(range);
    const startOffset = this.offsetAt(range.start);
    const endOffset = this.offsetAt(range.end);
    return new DocumentLanguageRegion(range, startOffset, endOffset, text);
  }
}
