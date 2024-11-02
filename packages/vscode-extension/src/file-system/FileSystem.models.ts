import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { Tree, TreeNode } from '@native-twin/helpers/tree';

export class VirtualFSEntryID implements Equal.Equal {
  constructor(readonly uri: vscode.Uri) {}

  [Equal.symbol](that: unknown): boolean {
    return (
      that instanceof VirtualFSEntryID && this.uri.toString() === that.uri.toString()
    );
  }
  [Hash.symbol](): number {
    return Hash.string(this.uri.toString());
  }
}

export class VirtualFile implements vscode.FileStat, Equal.Equal {
  readonly _tag = 'VirtualFile';
  readonly id: VirtualFSEntryID;
  type: vscode.FileType;
  ctime: number;
  mtime: number;
  size: number;
  name: string;
  contents?: Uint8Array;

  constructor(
    readonly uri: vscode.Uri,
    contents: Uint8Array,
  ) {
    this.name = path.posix.basename(uri.path);
    this.contents = contents;
    this.id = new VirtualFSEntryID(this.uri);
    this.type = vscode.FileType.File;
    this.ctime = Date.now();
    this.mtime = Date.now();
    this.size = contents.byteLength;
  }

  [Equal.symbol](that: unknown): boolean {
    return that instanceof VirtualFile && this.uri.toString() === that.uri.toString();
  }

  [Hash.symbol](): number {
    return Hash.string(this.uri.toJSON());
  }
}

export class VirtualDirectory implements vscode.FileStat, Equal.Equal {
  readonly _tag = 'VirtualDirectory';
  readonly id: VirtualFSEntryID;
  type: vscode.FileType;
  ctime: number;
  mtime: number;
  size: number;
  name: string;

  constructor(readonly uri: vscode.Uri) {
    this.id = new VirtualFSEntryID(this.uri);
    this.type = vscode.FileType.Directory;
    this.ctime = Date.now();
    this.mtime = Date.now();
    this.size = 0;
    this.name = path.posix.basename(this.uri.path);
  }

  [Equal.symbol](that: unknown): boolean {
    return (
      that instanceof VirtualDirectory && this.uri.toString() === that.uri.toString()
    );
  }

  [Hash.symbol](): number {
    return Hash.string(this.uri.toJSON());
  }
}

export type VirtualEntryType = VirtualFile | VirtualDirectory;

export type VirtualEntryTreeRoot = Tree<VirtualEntryType>;
export type VirtualEntryTreeNode<T extends VirtualEntryType> = TreeNode<T>;

export const createVirtualEntryID = (uri: vscode.Uri) => new VirtualFSEntryID(uri);

// export type TwinVirtualEntry = Data.TaggedEnum<{
//   Error: { readonly error: string };
//   VirtualFile: { readonly value: VirtualFile };
//   VirtualDirectory: { readonly value: VirtualDirectory };
// }>;
// export const TwinVirtualEntry = Data.taggedEnum<TwinVirtualEntry>();

export interface VirtualFileWriteOptions {
  readonly create: boolean;
  readonly overwrite: boolean;
}

export interface VirtualEntryInfo {
  id: VirtualFSEntryID;
  uri: vscode.Uri;
  path: string;
  basename: string;
}

export interface UriRelatedInfo extends VirtualEntryInfo {
  parent: VirtualEntryInfo;
}
