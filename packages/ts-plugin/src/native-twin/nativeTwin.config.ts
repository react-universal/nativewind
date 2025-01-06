import {
  type RuntimeTW,
  type TailwindConfig,
  type ThemeContext,
  type __Theme__,
  createTailwind,
  createThemeContext,
  defineConfig,
} from '@native-twin/core';
import type ts from 'typescript';
import '@native-twin/core';
import { type SheetEntry, createVirtualSheet } from '@native-twin/css';
import { presetTailwind } from '@native-twin/preset-tailwind';
import type { TailwindPresetTheme } from '@native-twin/preset-tailwind';
import type { NativeTwinPluginConfiguration } from '../plugin.types';
import { requireJS } from '../utils/load-config';

export type InternalTwinConfig = TailwindConfig<__Theme__ & TailwindPresetTheme>;
export type InternalTwFn = RuntimeTW<__Theme__ & TailwindPresetTheme, SheetEntry[]>;
export type InternalTwinThemeContext = ThemeContext<__Theme__ & TailwindPresetTheme>;

export const createTwin = (info: ts.server.PluginCreateInfo) => {
  const pluginConfig: NativeTwinPluginConfiguration = {
    tags: ['tw', 'apply', 'css', 'styled', 'variants'],
    attributes: ['tw', 'class', 'className', 'variants'],
    styles: ['style', 'styled'],
    debug: false,
    enable: true,
  };

  const twinConfig = loadUserTwinConfigFile(info);
  const twin = createTwinHandlers(twinConfig);

  return {
    pluginConfig,
    twinConfig,
    twin,
  };
};

export const createTwinHandlers = (config: InternalTwinConfig) => {
  const globalSheet = createVirtualSheet();
  const tw = createTailwind(config, globalSheet);
  const context = createThemeContext(config);

  return {
    globalSheet,
    tw,
    context,
  };
};

const loadUserTwinConfigFile = (info: ts.server.PluginCreateInfo): InternalTwinConfig => {
  const rootDir = info.project.getCurrentDirectory();
  const file = `${rootDir}/tailwind.config.ts`;
  const fileExists = info.project.projectService.host.fileExists(file);
  if (fileExists) {
    const config = requireJS(file);
    return defineConfig(config);
  }
  return defineConfig({
    content: [],
    presets: [presetTailwind()],
  });
};
