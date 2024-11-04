import * as Equal from 'effect/Equal';
import * as Equivalence from 'effect/Equivalence';
import { pipe } from 'effect/Function';
import * as Predicate from 'effect/Predicate';
import * as vscode from 'vscode';
import type { TreeNode } from '@native-twin/helpers/tree';
import {
  VirtualDirectory,
  VirtualEntryType,
  VirtualFile,
  VirtualFSEntryID,
} from './FileSystem.models';

export const isVirtualFile: Predicate.Refinement<VirtualEntryType, VirtualFile> = (
  x,
): x is VirtualFile => x._tag === 'VirtualFile';

export const isVirtualFileNode: Predicate.Refinement<
  TreeNode<VirtualEntryType>,
  TreeNode<VirtualFile>
> = (x): x is TreeNode<VirtualFile> => isVirtualFile(x.value);

export const isVirtualDirectoryNode: Predicate.Refinement<
  TreeNode<VirtualEntryType>,
  TreeNode<VirtualDirectory>
> = (x): x is TreeNode<VirtualDirectory> => isVirtualDirectory(x.value);

export const isVirtualDirectory: Predicate.Refinement<
  VirtualEntryType,
  VirtualDirectory
> = (x): x is VirtualDirectory => x._tag === 'VirtualDirectory';

export const isSameEntryID = Equal.equivalence<VirtualFSEntryID>();
export const isSameEntry = pipe(
  isSameEntryID,
  Equivalence.mapInput((b: VirtualEntryType) => b.id),
);
const virtualEntryEQ = Equal.equivalence<VirtualEntryType>();

export const isSameVirtualFile = Equivalence.combine(virtualEntryEQ, isSameEntry);

export const vscodePatternEquivalence = Equivalence.make<vscode.RelativePattern>(
  (a, b) => {
    return a.base === b.base && a.pattern === b.pattern;
  },
);
