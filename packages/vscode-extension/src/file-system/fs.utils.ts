// import * as Equal from 'effect/Equal';
import { Option } from 'effect';
import * as RA from 'effect/Array';
import { pipe } from 'effect/Function';
import * as vscode from 'vscode';
import {
  createVirtualEntryID,
  VirtualEntryType,
  VirtualEntryTreeRoot,
  VirtualEntryTreeNode,
  VirtualFile,
} from './FileSystem.models';
import * as fsPredicates from './fs.predicates';

export const findEntryByUri = (
  root: VirtualEntryTreeRoot,
  uri: vscode.Uri,
): VirtualEntryTreeNode<VirtualEntryType> => {
  return pipe(
    root.all(),
    RA.findFirst(({ value }) =>
      fsPredicates.isSameEntryID(value.id, createVirtualEntryID(uri)),
    ),
    Option.getOrThrowWith(() => vscode.FileSystemError.FileNotADirectory(uri)),
  );
};

export const findVirtualFolder = (
  root: VirtualEntryTreeRoot,
  uri: vscode.Uri,
): VirtualEntryTreeNode<VirtualEntryType> => {
  const foundEntry = findEntryByUri(root, uri);

  if (!fsPredicates.isVirtualDirectoryNode(foundEntry)) {
    throw vscode.FileSystemError.FileNotADirectory(uri);
  }

  return foundEntry;
};

export const findVirtualFile = (
  root: VirtualEntryTreeRoot,
  uri: vscode.Uri,
): VirtualEntryTreeNode<VirtualFile> => {
  const foundEntry = findEntryByUri(root, uri);

  if (!fsPredicates.isVirtualFileNode(foundEntry)) {
    throw vscode.FileSystemError.FileIsADirectory(uri);
  }

  return foundEntry;
};
