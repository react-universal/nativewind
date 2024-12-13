import { themes } from 'prism-react-renderer';
import { useState } from 'react';
import Frame from 'react-frame-component';
import { LiveEditor, LivePreview, LiveProvider } from 'react-live';

interface RenderPreviewProps {
  code: string;
  css: string;
}

export const RenderPreview = (props: RenderPreviewProps) => {
  const [stage, setStage] = useState('preview');
  return (
    <div className='flex flex-1 flex-col gap-2 px-2 bg-[#1f1f1f] border-l-white border-l-1'>
      <div className='flex gap-2 px-2 border-b-1 py-2 items-center'>
        <a
          href='#'
          className='text-gray text-sm font-bold border-1 rounded-md p-1 hover:text-black'
          onClick={() => {
            setStage('preview');
          }}
        >
          Show Preview
        </a>
        <a
          href='#'
          className='text-gray text-sm font-bold border-1 rounded-md p-1'
          onClick={() => {
            setStage('css');
          }}
        >
          Show CSS out
        </a>
        <a
          href='#'
          className='text-gray text-sm font-bold border-1 rounded-md p-1'
          onClick={() => {
            setStage('config');
          }}
        >
          Show Config
        </a>
      </div>
      <Frame className='rounded-sm'>
        <div>
          <style>{props.css}</style>

          <LiveProvider code={props.code}>
            {stage === 'preview' ? <LivePreview /> : null}
            {stage === 'css' ? <CssOutput code={props.css} /> : null}
            {stage === 'config' ? (
              <LiveEditor
                disabled
                language='typescript'
                // theme={themes.oneDark}
                code={props.code}
              />
            ) : null}
          </LiveProvider>
        </div>
      </Frame>
    </div>
  );
};

const CssOutput = (props: { code: string }) => {
  return <LiveEditor language='css' theme={themes.vsDark} code={props.code} />;
};
