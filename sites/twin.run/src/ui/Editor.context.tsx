import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { IDisposable } from 'monaco-editor';
import { TwinEditorConfigService } from '@/editor/services/EditorConfig.service';
import { FileSystemService } from '@/editor/services/FileSystem.service';
import { MonacoContext } from '@/editor/services/MonacoContext.service';
import { useEditorBoot } from './useEditorBoot';

interface IEditorUIContext {
  app: MonacoContext['Type'];
  config: TwinEditorConfigService['Type'];
  fs: FileSystemService['Type'];
  addSubscription: (x: IDisposable) => void;
  isReady: boolean;
  bootEditor: () => Promise<void>;
}

const EditorUIContext = createContext<IEditorUIContext>({
  app: {},
  config: {},
  fs: {},
} as any);

interface EditorUIProviderProps {
  app: MonacoContext['Type'];
  config: TwinEditorConfigService['Type'];
  fs: FileSystemService['Type'];
  children: ReactNode;
}

export const EditorUIProvider = (props: EditorUIProviderProps) => {
  const { isReady, bootEditor } = useEditorBoot(props.app, props.config);
  const [subscriptions, setSubscriptions] = useState(new Set<IDisposable>());

  useEffect(() => {
    () => {
      for (const s of subscriptions) {
        s.dispose();
      }
    };
  }, [subscriptions]);

  const addSubscription = (sub: IDisposable) => {
    setSubscriptions((x) => x.add(sub));
  };

  return (
    <EditorUIContext.Provider
      value={{
        app: props.app,
        config: props.config,
        fs: props.fs,
        addSubscription,
        isReady,
        bootEditor,
      }}
    >
      {!isReady ? (
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
