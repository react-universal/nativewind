import type { Visitor } from '@babel/core';
// @ts-expect-error
import environmentVisitor from '@babel/helper-environment-visitor';
import { addNamed } from '@babel/helper-module-imports';
import type { ParseResult } from '@babel/parser';
import traverse, { type NodePath, visitors } from '@babel/traverse';
import type * as t from '@babel/types';
import * as Chunk from 'effect/Chunk';
import * as Data from 'effect/Data';
import * as Stream from 'effect/Stream';
import type { NativeTwinPluginConfiguration } from '../shared/compiler.constants';

export type TwinExtractedPath = Data.TaggedEnum<{
  JSXElement: NodePath<t.JSXElement>;
}>;

export const TwinExtractedPath = Data.taggedEnum<TwinExtractedPath>();

interface TwinTraversalState {
  extracted: NodePath<t.JSXElement>[];
  config: NativeTwinPluginConfiguration;
}

export const extractBabelPaths = (
  ast: ParseResult<t.File>,
  config: NativeTwinPluginConfiguration,
) =>
  Stream.async<NodePath<t.JSXElement>>((emit) => {
    traverse(
      ast,
      createBabelVisitors(AddRootJSXElementPathToState, AddStyleSheetImportVisitor, {
        Program: {
          exit() {
            emit.chunk(Chunk.fromIterable(this.extracted)).then(() => emit.end());
          },
        },
      }),
      undefined,
      {
        extracted: [],
        config,
      },
    );
  });

/**
 * ############################
 * ###### BABEL VISITORS ######
 * ############################
 */

const createBabelVisitors = (...twinVisitors: Visitor<TwinTraversalState>[]) =>
  // @ts-expect-error
  visitors.merge(twinVisitors, traverse.visitors.environmentVisitor);

const AddRootJSXElementPathToState: Visitor<TwinTraversalState> = {
  JSXElement(path) {
    this.extracted.push(path);
    path.skip();
  },
};

const AddStyleSheetImportVisitor: Visitor = {
  Program: {
    exit(path) {
      addNamed(path, 'StyleSheet', '@native-twin/jsx/sheet', {
        importedInterop: 'compiled',
        blockHoist: 1,
        importingInterop: 'babel',
        importedType: 'commonjs',
        importPosition: 'after',
        importedSource: '@native-twin/jsx/sheet',
        nameHint: '__Twin___StyleSheet',
      });
    },
  },
};
