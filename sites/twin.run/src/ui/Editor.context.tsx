import type { IDisposable } from 'monaco-editor';
import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import type { FileSystemService } from '../editor/services/FileSystem.service';
import type { MonacoContext } from '../editor/services/MonacoContext.service';
import * as Effect from 'effect/Effect';
import * as Stream from 'effect/Stream';
import * as Fiber from 'effect/Fiber';
import {
  type TwinEditorState,
  TwinEditorStateCtx,
} from '../editor/services/TwinEditorState.service';
import { EditorMainRuntime } from '../editor/editor.runtime';

interface IEditorUIContext {
  app: MonacoContext;
  fs: FileSystemService['Type'];
  addSubscription: (x: IDisposable) => void;
  isReady: boolean;
  bootEditor: (element: HTMLElement) => Promise<void>;
  state: TwinEditorState;
}

const EditorUIContext = createContext<IEditorUIContext>({
  app: {},
  config: {},
  fs: {},
} as any);

interface EditorUIProviderProps {
  app: MonacoContext;
  fs: FileSystemService['Type'];
  children: ReactNode;
}

export const EditorUIProvider = (props: EditorUIProviderProps) => {
  const [editorState, dispatch] = useState<TwinEditorState | null>(null);
  const [subscriptions, setSubscriptions] = useState(new Set<IDisposable>());

  useEffect(() => {
    () => {
      for (const s of subscriptions) {
        s.dispose();
      }
    };
  }, [subscriptions]);

  useEffect(() => {
    const fiber = Effect.gen(function* () {
      const { state } = yield* TwinEditorStateCtx;
      yield* state.changes.pipe(
        Stream.runForEach((x) => Effect.sync(() => dispatch(x))),
        Effect.forkDaemon,
      );
    }).pipe(EditorMainRuntime.runFork);

    return () => {
      EditorMainRuntime.runPromise(Fiber.interrupt(fiber));
    };
  }, []);

  const addSubscription = (sub: IDisposable) => {
    setSubscriptions((x) => x.add(sub));
  };

  const bootEditor = (element: HTMLElement) =>
    EditorMainRuntime.runPromise(
      TwinEditorStateCtx.pipe(
        Effect.map((x) => x.bootEditor(element)),
        Effect.andThen(() => Effect.void),
      ),
    );

  if (!editorState) return null;
  return (
    <EditorUIContext.Provider
      value={{
        app: props.app,
        fs: props.fs,
        addSubscription,
        isReady: editorState.isReady,
        bootEditor,
        state: editorState,
      }}
    >
      {!editorState.isReady ? (
        <div
          className={`
            absolute w-[100vw] h-[100vh] bg-black
            flex items-center justify-center
          `}
        >
          <video src='./loading-status.webm' loop controls={false} autoPlay></video>
        </div>
      ) : (
        <div />
      )}
      {props.children}
    </EditorUIContext.Provider>
  );
};

export const useTwinEditor = () => useContext(EditorUIContext);
