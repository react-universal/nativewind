import type * as t from '@babel/types';
import { extractLanguageRegions } from '@native-twin/compiler';
import type { NativeTwinPluginConfiguration } from '@native-twin/language-service';
import * as RA from 'effect/Array';
import * as Data from 'effect/Data';
import * as vscode from 'vscode';

interface TwinTextDocumentShape {
  document: vscode.TextDocument;
}

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

export class TwinTextDocument implements TwinTextDocumentShape {
  constructor(readonly document: vscode.TextDocument) {
    this.babelLocationToVscode.bind(this);
    this.getLanguageRegions.bind(this);
    this.findTokenLocationAt.bind(this);
    this.isPositionAtOffset.bind(this);
  }

  getLanguageRegions(config: NativeTwinPluginConfiguration) {
    return extractLanguageRegions(this.document.getText(), config);
  }

  babelLocationToVscode(location: t.SourceLocation) {
    const range = new vscode.Range(
      this.document.positionAt(location.start.index),
      this.document.positionAt(location.end.index),
    );
    const start = this.document.offsetAt(range.start);
    const end = this.document.offsetAt(range.end);
    const text = this.document.getText(range);
    return {
      text,
      range,
      offset: {
        start,
        end,
      },
    };
  }

  isPositionAtOffset(bounds: TwinTokenLocation['offset'], offset: number) {
    return offset >= bounds.start && offset <= bounds.end;
  }

  findTokenLocationAt(position: vscode.Position, config: NativeTwinPluginConfiguration) {
    const regions = this.getLanguageRegions(config);
    const ranges = regions.map((x) => this.babelLocationToVscode(x));
    const positionOffset = this.document.offsetAt(position);
    return RA.findFirst(ranges, (x) => this.isPositionAtOffset(x.offset, positionOffset));
  }
}
