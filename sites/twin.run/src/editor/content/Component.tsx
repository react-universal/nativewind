import * as React from 'react';
import { createVariants } from '@native-twin/core';

const cls = createVariants({
  base: 'bg-black',
  variants: {
    variant: {
      primary: 'bg-blue',
      secondary: 'bg-red',
    },
  },
});

export const MockComponent = () => {
  return (
    <div className={cls({ variant: 'primary' })}>
      <span className='text-lg'>Example text</span>
    </div>
  );
};
