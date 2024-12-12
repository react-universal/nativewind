// import { pipe } from 'effect/Function';
// import * as Option from 'effect/Option';
import path from 'path';
// import { JSXElementNode } from '@native-twin/compiler/babel';
import type { NativeTwinPluginConfiguration } from '@native-twin/language-service';
import { pipe } from 'effect';
import * as RA from 'effect/Array';
import * as vscode from 'vscode';
import { thenable } from '../../extension/extension.utils.js';
import type { TwinTextDocument } from '../../language/index.js';

export class TwinFileTreeNode {
  readonly _tag = 'FileTreeNode';
  private _childs: FileTwinRegionTreeNode[] = [];

  constructor(
    readonly workspaceRoot: string,
    private readonly twinDocument: TwinTextDocument,
  ) {}

  get label() {
    return path.posix.relative(this.workspaceRoot, this.twinDocument.document.fileName);
  }

  get id() {
    return this.twinDocument.document.fileName;
  }

  get document() {
    return this.twinDocument.document;
  }

  getChilds(config: NativeTwinPluginConfiguration): FileTwinRegionTreeNode[] {
    if (this._childs.length > 0) return this._childs;
    const regions = this.twinDocument.getLanguageRegions(config);
    return pipe(
      RA.map(regions, (region) => this.twinDocument.babelLocationToVscode(region)),
      RA.map((region) => new FileTwinRegionTreeNode(this, region)),
      RA.dedupeWith((a, b) => a.id === b.id),
    );
  }
}

interface TwinFileRegion {
  text: string;
  range: vscode.Range;
  offset: {
    start: number;
    end: number;
  };
}
export class FileTwinRegionTreeNode {
  readonly _tag = 'FileTwinRegionTreeNode';

  constructor(
    readonly parent: TwinFileTreeNode,
    readonly region: TwinFileRegion,
  ) {}

  get id() {
    return `P.${this.parent.id}-St.${this.region.offset.start}-Ed.${this.region.offset.end}`;
  }

  get label() {
    return `L${this.region.range.start.line}.${this.region.offset.start}:${this.region.offset.end}`;
  }

  onClick() {
    return thenable(() =>
      vscode.window.showTextDocument(this.parent.document.uri, {
        selection: this.region.range,
        // viewColumn: this.region.range.start.character
      }),
    );
  }
}

export type AnyTreeDataNode = TwinFileTreeNode | FileTwinRegionTreeNode;
