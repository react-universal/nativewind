import { File } from '@effect/platform/FileSystem';
import { Data } from 'effect';
import path from 'node:path';

interface VirtualFileShape {
  readonly file: File;
  readonly content: string;
  readonly sourcemaps: string;
  readonly filePath: string;
}

export class VirtualFile extends Data.TaggedClass('VirtualFile')<VirtualFileShape> {
  get dirname() {
    return path.posix.dirname(this.filePath);
  }

  get filename() {
    return path.posix.basename(this.filePath);
  }

  get isJSX() {
    return this.filename.endsWith('.tsx') || this.filename.endsWith('.jsx');
  }
}
