'use client';

// import { ReactNode, useState } from 'react';
// import tailwindConfig from '../../tailwind.config';
import { tw, tailwindConfig } from '../twin.css';
import { sheetEntriesToCss, SheetEntry } from '@native-twin/css';
import { ReactNode } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { TailwindUserConfig } from '@native-twin/core';

// import { NativeTwinSheet } from '@native-twin/adapters/next/app';

// let config = tailwindConfig as TailwindUserConfig;
// if (tailwindConfig.mode !== 'web') {
//   config = Object.assign({ mode: 'web' }, tw.config) as TailwindUserConfig;
// }

const twin = tw;

export const NativeTwinProvider = ({ children }: { children: ReactNode }) => {
  useServerInsertedHTML(() => {
    return (
      <style
        dangerouslySetInnerHTML={{
          __html: sheetEntriesToCss((twin.target ?? []) as SheetEntry[]),
        }}
      />
    );
  });
  return <>{children}</>;
};
