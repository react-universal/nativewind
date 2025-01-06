import type * as t from '@babel/types';
import * as Data from 'effect/Data';
import type * as VSCDocument from 'vscode-languageserver-textdocument';

export interface BabelPosition {
  line: number;
  column: number;
  index: number;
}

type TwinRangeEnum = Data.TaggedEnum<{
  vscode: VSCDocument.Range;
  babel: { readonly range: t.SourceLocation };
}>;

interface MyResultDefinition extends Data.TaggedEnum.WithGenerics<2> {
  readonly taggedEnum: TwinRangeEnum;
}
const TwinRange = Data.taggedEnum<MyResultDefinition>();

export const createVscodeRange = (
  start: VSCDocument.Position,
  end: VSCDocument.Position,
) => {
  return TwinRange.vscode({ start, end });
};

export const createBabelRange = (start: BabelPosition, end: BabelPosition) => {
  return TwinRange.babel({
    range: { start, end, filename: 'asd', identifierName: null },
  });
};
