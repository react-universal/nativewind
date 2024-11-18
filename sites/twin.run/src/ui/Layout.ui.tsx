import { ReactNode } from 'react';

interface PlaygroundLayoutProps {
  children: ReactNode;
}

export const PlaygroundLayout = ({ children }: PlaygroundLayoutProps) => {
  return (
    <div className='flex flex-1 w-screen h-screen flex-col'>
      <div className='w-full h-full'>{children}</div>
    </div>
  );
};
