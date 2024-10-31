import SyntaxHighlighter from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import CopyCodeButton from '../CopyCodeButton';

export const Code = ({ codeString }: { codeString: string }) => {
  return (
    <div className='w-full flex flex-col  relative  rounded-lg overflow-hidden'>
      <SyntaxHighlighter language='tsx' style={darcula}>
        {codeString}
      </SyntaxHighlighter>
      <CopyCodeButton code={codeString}></CopyCodeButton>
    </div>
  );
};
