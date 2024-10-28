import * as Path from '@effect/platform/Path';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import * as Record from 'effect/Record';

interface IPackageJson {
  exports: string | Record<string, Record<string, string>>;
  main: string | undefined;
}

export const getTargetPackageEntries = (packagePath: string) =>
  Effect.gen(function* () {
    const importedPackage = yield* Effect.promise(async (): Promise<IPackageJson> => {
      return import(packagePath, {
        with: { type: 'json' },
      }).then((x) => x.default);
    });

    return yield* getExportsFromPackage(importedPackage);
  });

const getExportsFromPackage = (libPackage: IPackageJson) =>
  Effect.gen(function* () {
    const path = yield* Path.Path;

    return pipe(
      libPackage,
      Record.get('exports'),
      Option.flatMap((x) => {
        if (typeof x === 'string' || typeof x === 'undefined') {
          return Option.none();
        }

        return Option.some(Object.values(x));
      }),
      Option.getOrElse((): Record<string, string>[] => []),
      RA.filter((x) => typeof x !== 'string'),
      RA.flatMap((x) => Object.values(x)),
      RA.filter((x) => !x.endsWith('.d.ts')),
      RA.filter((x) => !x.includes('/esm')),
      RA.map((x) => x.replace('/build', '/src')),
      RA.map((x) => {
        let input = x;
        let output = x.replace('/src', '').replace('.js', '');

        if (input.endsWith('.js')) {
          input = input.replace('.js', '.ts');
        } else {
          input = path.join(input, 'index');
          output = 'index';
        }
        return {
          in: input.replace('./', ''),
          out: output.replace('./', ''),
        };
      }),
      RA.dedupe,
    );
  });
