import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Runtime from 'effect/Runtime';
import * as Scope from 'effect/Scope';
import * as Stream from 'effect/Stream';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import * as vscode from 'vscode';
import { Constants } from '@native-twin/language-service';
import type { NativeTwinPluginConfiguration } from '@native-twin/language-service';
import { VscodeContext } from './extension.service';

export const executeCommand = (command: string, ...args: Array<any>) =>
  thenable(() => vscode.commands.executeCommand(command, ...args));

export const registerCommand = <R, E, A>(
  command: string,
  f: (...args: Array<any>) => Effect.Effect<A, E, R>,
) => {
  return Effect.gen(function* () {
    const context = yield* VscodeContext;
    const runtime = yield* Effect.runtime<R>();
    const run = Runtime.runFork(runtime);

    context.subscriptions.push(
      vscode.commands.registerCommand(command, (...args) =>
        f(...args).pipe(
          Effect.catchAllCause(Effect.log),
          Effect.annotateLogs({ command }),
          run,
        ),
      ),
    );
  });
};

export const thenable = <A>(f: () => Thenable<A>) => {
  return Effect.async<A>((resume) => {
    f().then((_) => resume(Effect.succeed(_)));
  });
};

export const disposable = <A>(
  f: () => Thenable<A | undefined>,
): Effect.Effect<A, Cause.NoSuchElementException> => {
  return thenable(f).pipe(Effect.flatMap(Effect.fromNullable));
};

export const listenDisposableEvent = <A, R>(
  event: vscode.Event<A>,
  f: (data: A) => Effect.Effect<void, never, R>,
): Effect.Effect<never, never, R> => {
  return Effect.flatMap(Effect.runtime<R>(), (runtime) =>
    Effect.async<never>((_resume) => {
      const run = Runtime.runFork(runtime);
      const d = event((data) =>
        run(
          Effect.catchAllCause(f(data), (_) =>
            Effect.log('unhandled defect in event listener', _),
          ),
        ),
      );
      return Effect.sync(() => {
        d.dispose();
      });
    }),
  );
};

export const listenForkEvent = <A, R>(
  event: vscode.Event<A>,
  f: (data: A) => Effect.Effect<void, never, R>,
) => Effect.forkScoped(listenDisposableEvent(event, f));

export interface ConfigValue<Section extends string, A> {
  section: Section;
  value: A;
}
export interface ConfigRef<Section extends string, A> {
  readonly get: Effect.Effect<A>;
  readonly changes: Stream.Stream<ConfigValue<Section, A>>;
}

/**
 *
 * @description Subscribe to a section value for the plugin using its namespace
 * the default namespace its `nativeTwin`
 */
export const extensionConfig = <Section extends string, A>(
  namespace: string,
  setting: Section,
): Effect.Effect<ConfigRef<Section, Option.Option<A>>, never, Scope.Scope> =>
  Effect.gen(function* () {
    const get = () => vscode.workspace.getConfiguration(namespace).get<A>(setting);
    const ref = yield* SubscriptionRef.make<Option.Option<A>>(Option.fromNullable(get()));
    yield* listenForkEvent(vscode.workspace.onDidChangeConfiguration, (_) => {
      const affected = _.affectsConfiguration(setting);
      if (!affected) {
        return Effect.void;
      }
      return SubscriptionRef.set(ref, Option.fromNullable(get()));
    });

    return {
      get: SubscriptionRef.get(ref),
      changes: Stream.changes(ref.changes).pipe(
        Stream.map((x) => {
          return {
            value: x,
            section: setting,
          };
        }),
      ),
    };
  });

/**
 *
 * @description Subscribe to a section value for the plugin using its namespace
 * the default namespace its `nativeTwin` \n
 * The main difference with extensionConfig its you need to provide a default value
 */
export const extensionConfigValue = <Section extends string, A>(
  key: Section,
  defaultValue: A,
): Effect.Effect<ConfigRef<Section, A>, never, Scope.Scope> =>
  Effect.gen(function* () {
    const get = () =>
      vscode.workspace.getConfiguration(Constants.configurationSection).get<A>(key);
    const ref = yield* SubscriptionRef.make(get() ?? defaultValue);

    yield* listenForkEvent(vscode.workspace.onDidChangeConfiguration, (_) => {
      const affected = _.affectsConfiguration(`nativeTwin.${key}`);
      console.log('AFFECTED: ', affected, key);
      if (affected) {
        return SubscriptionRef.set(ref, get() ?? defaultValue);
      }
      return Effect.void;
    });

    return {
      get: SubscriptionRef.get(ref),
      changes: Stream.changes(ref.changes).pipe(
        Stream.map((x): ConfigValue<Section, A> => {
          return {
            section: key,
            value: x,
          };
        }),
      ),
    };
  });

export interface ExtensionConfigRef {
  readonly get: Effect.Effect<NativeTwinPluginConfiguration>;
  readonly changes: Stream.Stream<NativeTwinPluginConfiguration>;
}
/**
 *
 * @description Subscribe to a section value for the plugin using its namespace
 * the default namespace its `nativeTwin` \n
 * The main difference with extensionConfig its you need to provide a default value
 */
export const extensionConfigState = (
  defaultValue: NativeTwinPluginConfiguration,
): Effect.Effect<ExtensionConfigRef, never, Scope.Scope> =>
  Effect.gen(function* () {
    const get = () =>
      vscode.workspace.getConfiguration(
        Constants.configurationSection,
      ) as unknown as NativeTwinPluginConfiguration;
    const ref = yield* SubscriptionRef.make(get() ?? defaultValue);

    yield* listenForkEvent(vscode.workspace.onDidChangeConfiguration, (_) => {
      const affected = _.affectsConfiguration(`nativeTwin`);
      if (affected) {
        return SubscriptionRef.set(ref, get() ?? defaultValue);
      }
      return Effect.void;
    });

    return {
      get: SubscriptionRef.get(ref),
      changes: Stream.changes(ref.changes),
    };
  });
