import { NodePath } from '@effect/platform-node';
import { Path } from '@effect/platform/Path';
import * as Doc from '@effect/printer/Doc';
import * as RA from 'effect/Array';
import * as Chunk from 'effect/Chunk';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as GroupBy from 'effect/GroupBy';
import * as Order from 'effect/Order';
import * as Stream from 'effect/Stream';

export const createFilesTree = (files: string[], rootDir: string) => {
  return Effect.gen(function* () {
    const path = yield* Path;
    if (!RA.isNonEmptyArray(files)) return '';

    const data = yield* Stream.fromIterable(files).pipe(
      Stream.groupBy((x) => Effect.succeed([path.dirname(x), x] as const)),
      GroupBy.evaluate((key, stream) =>
        Stream.fromEffect(
          Stream.runCollect(stream).pipe(
            Effect.andThen((chunk) => [key, Chunk.toReadonlyArray(chunk)] as const),
          ),
        ),
      ),
      Stream.map((x) => ({
        nesting: x[0].split('/').length,
        dirname: x[0],
        files: x[1],
      })),
      Stream.runCollect,
      Effect.map(Chunk.toReadonlyArray),
    );
    const result = pipe(
      data,
      RA.sortWith((x) => x.nesting, Order.number),
      RA.map((info) => {
        const indexNesting = info.nesting - 1;
        const parentSymbol =
          indexNesting === 0 || indexNesting + 1 >= data.length
            ? Doc.empty
            : Doc.char('\u{251C}');
        // const titleNesting = indexNesting;

        const title = Doc.hsep([parentSymbol, Doc.text(info.dirname)]);
        const childs = info.files.map((x, i) => {
          const listSymbol = Doc.char(
            i + 1 === info.files.length ? '\u{2514}' : '\u{251C}',
          );
          return Doc.hsep([
            Doc.char('\u{239F}'),
            listSymbol,
            Doc.text(`/${x}`.replace(`/${info.dirname}`, '').replace(/^\//, '')),
          ]);
        });

        return Doc.vsep([title, Doc.vsep(childs)]);
      }),
    );

    const message = Doc.render(Doc.vsep(result), { style: 'pretty' });
    return message;
  }).pipe(Effect.provide(NodePath.layerPosix));
};
