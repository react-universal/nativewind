import type { NativeTwinPluginConfiguration } from '@native-twin/language-service';
import type * as Effect from 'effect/Effect';
import type * as Stream from 'effect/Stream';
import type * as vscode from 'vscode';

export interface ConfigValue<Section extends string, A> {
  section: Section;
  value: A;
}
export interface ConfigRef<Section extends string, A> {
  readonly get: Effect.Effect<A>;
  readonly changes: Stream.Stream<ConfigValue<Section, A>>;
}

export interface Emitter<A> {
  readonly event: vscode.Event<A>;
  readonly fire: (data: A) => Effect.Effect<void>;
}

export interface ExtensionConfigRef {
  readonly get: Effect.Effect<NativeTwinPluginConfiguration>;
  readonly changes: Stream.Stream<NativeTwinPluginConfiguration>;
}
