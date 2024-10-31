'use client';

import { Button } from '../ui/button';

export const ButtonVariable = ({
  children,
  color,
}: {
  color: string;
  children: string;
}) => {
  return (
    <Button
      style={{ background: color }}
      className=' bg-[#26C6DA]  text-[24px] h-[54px] w-[229px] px-8 py-5 text-white'
    >
      {children}
    </Button>
  );
};
