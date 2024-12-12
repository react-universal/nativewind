import * as Option from 'effect/Option';
import jitiFactory from 'jiti';
import { transform } from 'sucrase';

let jiti: ReturnType<typeof jitiFactory> | null = null;

function lazyJiti() {
  return (
    jiti ??
    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
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

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function requireJSThrowable(path: string): any {
  // biome-ignore lint/complexity/useArrowFunction: <explanation>
  const config = (function () {
    try {
      return path ? require(path) : {};
    } catch {
      return lazyJiti()(path);
    }
  })();

  return config.default ?? config;
}

export const requireJS = Option.liftThrowable(requireJSThrowable);
