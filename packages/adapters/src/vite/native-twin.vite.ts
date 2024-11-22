import { createFilter, Plugin, PluginOption } from 'vite';
import { createTwinExtractor, TwinVitePluginConfig } from './twin.transform';

const defaultIncludeRE = /\.[tj]sx?$/;

export function nativeTwinVite(config: TwinVitePluginConfig): PluginOption[] {
  const filter = createFilter(defaultIncludeRE, []);
  const twinExtractor = createTwinExtractor(config);

  const viteBabel: Plugin = {
    name: 'vite:twin-babel',
    enforce: 'pre',
    async transform(code, id) {
      if (id.includes('/node_modules/')) return;

      const [filepath] = id.split('?');
      if (!filter(filepath) || !filepath) return;

      await twinExtractor.extractor(code, filepath);
    },
  };
  return [viteBabel];
}
