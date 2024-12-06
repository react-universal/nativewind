import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    workspace: path.join(__dirname, '../../vitest.workspace.ts'),
  },
});
