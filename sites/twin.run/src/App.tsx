import React from 'react';
import ReactDOM from 'react-dom/client';
import { useEffect } from 'react';
import twinConfig from '../tailwind.config';
import { install } from '@native-twin/core';
import { startEditor, useEditorStore } from './store/editor.store';

install(twinConfig);

export default function VSCode() {
  const isReady = useEditorStore((x) => x.isReady);
  // const themeColor = useThemeColor('vs-dark');
  // console.log('COLOR: ', themeColor);

  useEffect(() => {
    const init = async () => {
      await startEditor();
    };
    init();
  }, []);

  return (
    <div className='flex flex-1 bg-black'>
      {!isReady && (
        <div
          className={`
          flex flex-1 items-center justify-center absolute
          bg-black w-full h-full
        `}
        >
          <h2 className='text(xl white)'>Loading...</h2>
        </div>
      )}
      <div className='flex flex-1' id='monaco-editor-root'></div>
    </div>
  );
}

const rootElement = document.getElementById('root');
ReactDOM.createRoot(rootElement!).render(<VSCode />);
