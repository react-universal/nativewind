import * as Effect from 'effect/Effect';
import * as Stream from 'effect/Stream';
import * as vscode from 'vscode';

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
