import { CodeGenerator } from '@babel/generator';
import type { ParseResult } from '@babel/parser';
import type * as t from '@babel/types';
import type { TreeNode } from '@native-twin/helpers/tree';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';
import * as Option from 'effect/Option';
import * as Sink from 'effect/Sink';
import * as Stream from 'effect/Stream';
import {
  type Position,
  type Range,
  TextDocument,
} from 'vscode-languageserver-textdocument';
import { streamJsxElementTrees } from '../utils/babel/babel.transform.js';
import { extractMappedAttributes, getBabelAST } from '../utils/babel/babel.utils.js';
import type { JSXElementTree } from './Babel.models.js';
import type { JSXMappedAttribute } from './jsx.models.js';

const quotesRegex = /^['"`].*['"`]$/g;

export const TwinTokenLocation = Data.tagged<TwinTokenLocation>('TwinTokenLocation');

export interface TwinBaseDocument {
  getText: (range?: Range) => string;
  offsetAt: (position: Position) => number;
  positionAt: (offset: number) => Position;
  isPositionAtOffset: (bounds: TwinTokenLocation['offset'], offset: number) => boolean;
}

export abstract class BaseTwinTextDocument implements Equal.Equal, TwinBaseDocument {
  readonly textDocument: TextDocument;
  private _ast: ParseResult<t.File>;

  constructor(path: string, content: string) {
    this.textDocument = TextDocument.create(path, 'twin', 1, content);
    this._ast = getBabelAST(this.textDocument.getText(), path);
    this.isPositionAtOffset.bind(this);
  }

  get ast() {
    return this._ast;
  }

  get uri() {
    return this.textDocument.uri;
  }

  get version() {
    return this.textDocument.version;
  }

  getText(range?: Range) {
    return this.textDocument.getText(range);
  }

  offsetAt(position: Position) {
    return this.textDocument.offsetAt(position);
  }

  positionAt(offset: number) {
    return this.textDocument.positionAt(offset);
  }

  isPositionAtOffset(bounds: TwinTokenLocation['offset'], offset: number) {
    return offset >= bounds.start && offset <= bounds.end;
  }

  babelLocationToRange(location: t.SourceLocation): Range {
    const startPosition: Position = {
      line: location.start.line,
      character: location.start.column,
    };
    const endPosition: Position = {
      line: location.end.line,
      character: location.end.column,
    };

    const range: Range = {
      start: startPosition,
      end: endPosition,
    };
    const text = this.getText(range);

    if (quotesRegex.test(text)) {
      range.start.character += 1;
      range.end.character -= 1;
      return { ...range };
    }
    return range;
  }

  // MARK: Equality protocol
  [Equal.symbol](that: unknown) {
    return (
      that instanceof BaseTwinTextDocument &&
      this.textDocument.version === that.textDocument.version &&
      this.textDocument.uri === that.textDocument.uri
    );
  }

  [Hash.symbol](): number {
    return Hash.combine(Hash.hash(this.textDocument.uri))(this.textDocument.version);
  }
}

export class TwinFileDocument extends BaseTwinTextDocument {
  get mappedAttributes() {
    return Effect.gen(this, function* () {
      const ast = this.ast;
      const mappedElements = yield* streamJsxElementTrees(ast, this.uri).pipe(
        Stream.fromIterableEffect,
        Stream.flatMap((tree) =>
          Stream.async<NodeWithMappedAttributes>((emit) => {
            tree.traverse((leave) => {
              emit.single({
                node: leave,
                runtimeData: extractMappedAttributes(leave.value.babelNode),
              });
              // const model = jsxTreeNodeToJSXElementNode(leave, entries, fileName);
            }, 'breadthFirst');

            emit.end();
          }),
        ),
        Stream.run(Sink.collectAllToSet()),
      );

      return mappedElements;
    });
  }

  generateCode(ast: ParseResult<t.File>) {
    return Effect.sync(() => {
      const generate = new CodeGenerator(ast);
      return Option.fromNullable(generate.generate()).pipe(Option.getOrNull);
    });
  }
}

export interface NodeWithMappedAttributes {
  runtimeData: JSXMappedAttribute[];
  node: TreeNode<JSXElementTree>;
}

interface TwinTokenLocation {
  _tag: 'TwinTokenLocation';
  range: Range;
  offset: {
    start: number;
    end: number;
  };
  text: string;
}
