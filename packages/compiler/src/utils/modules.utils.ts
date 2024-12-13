import * as fs from 'node:fs';
import * as Option from 'effect/Option';
import * as createJiti from 'jiti';
import { transform } from 'sucrase';

const jitiFactory = createJiti.createJiti;
let jiti: ReturnType<typeof jitiFactory> | null = null;

function lazyJiti() {
  return (
    jiti ??
    (jiti = jitiFactory(__filename, {
      interopDefault: true,
      cache: false,
      debug: false,
      requireCache: false,
      transform: (opts) => {
        return transform(opts.source, {
          transforms: ['typescript', 'imports'],
        });
      },
    }))
  );
}

export function nodeRequireJS<T = unknown>(path: string): T {
  // biome-ignore lint/complexity/useArrowFunction: <explanation>
  const config = (function () {
    try {
      return path ? require(path) : {};
    } catch {
      // const resolved = lazyJiti().esmResolve(path);
      // console.log('JJJJ', lazyJiti());
      const code = fs.readFileSync(path, 'utf-8');
      // lazyJiti().import(path, { default: true });
      return lazyJiti().evalModule(code, {
        async: false,
        forceTranspile: true,
        id: path,
      });
    }
  })();

  return config.default ?? config;
}

export function requireResolveUtil(path: string): string {
  // biome-ignore lint/complexity/useArrowFunction: <explanation>
  const result = (function () {
    try {
      return require.resolve(path);
    } catch {
      const resolved = lazyJiti().esmResolve(path);
      console.log('RESOLVED: ', resolved);
      return resolved;
    }
  })();

  return result;
}

export const maybeLoadJS = Option.liftThrowable(nodeRequireJS);
