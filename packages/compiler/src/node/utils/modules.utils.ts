import * as Option from 'effect/Option';
import jitiFactory from 'jiti';
import { transform } from 'sucrase';

let jiti: ReturnType<typeof jitiFactory> | null = null;

function lazyJiti() {
  return (
    jiti ??
    (jiti = jitiFactory(__filename, {
      interopDefault: true,
      transform: (opts) => {
        return transform(opts.source, {
          transforms: ['typescript', 'imports'],
        });
      },
    }))
  );
}

export function nodeRequireJS<T = unknown>(path: string): T {
  const config = (function () {
    try {
      return path ? require(path) : {};
    } catch {
      return lazyJiti()(path);
    }
  })();

  return config.default ?? config;
}

export const maybeLoadJS = Option.liftThrowable(nodeRequireJS);
