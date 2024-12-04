import { Chunk } from 'effect';

type EmittedFileKind = 'JS' | 'SOURCEMAP' | 'DECLARATION' | 'DECLARATION_MAP';
export interface EmittedFile {
  _tag: EmittedFileKind;
  path: string;
  content: string;
  source: string;
}

export const getEmittedFileKind = (filename: string): EmittedFileKind => {
  if (filename.endsWith('d.ts')) {
    return 'DECLARATION';
  } else if (filename.endsWith('.d.ts.map')) {
    return 'DECLARATION_MAP';
  } else if (filename.endsWith('.js.map')) {
    return 'SOURCEMAP';
  }
  return 'JS';
};

export const createFileToEmit = (emittedFile: Chunk.Chunk<EmittedFile>) => {
  const file = {
    sourcemaps: { path: '', content: '' },
    esm: { path: '', content: '' },
    dts: { path: '', content: '' },
    dtsMap: { path: '', content: '' },
  };
  return Chunk.reduce(emittedFile, file, (prev, current) => {
    switch (current._tag) {
      case 'JS':
        return {
          ...prev,
          esm: current,
        };
      case 'SOURCEMAP':
        return {
          ...prev,
          sourcemaps: current,
        };
      case 'DECLARATION':
        return {
          ...prev,
          dts: current,
        };
      case 'DECLARATION_MAP':
        return {
          ...prev,
          dtsMap: current,
        };
    }
  });
};
