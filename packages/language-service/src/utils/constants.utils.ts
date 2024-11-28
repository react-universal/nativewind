import type { DocumentSelector } from 'vscode-languageserver-protocol';
import type { RuleMeta } from '@native-twin/core';
import type { InternalTwinConfig } from '../models/twin/native-twin.types.js';

export const DOCUMENT_SELECTORS = [
  {
    scheme: 'file',
    language: 'typescript',
  },
  {
    scheme: 'file',
    language: 'typescriptreact',
  },
  {
    scheme: 'file',
    language: 'javascript',
  },
  {
    scheme: 'file',
    language: 'javascriptreact',
  },
] satisfies DocumentSelector;
export const configurationSection = 'nativeTwin';

export const DEFAULT_RULE_META: RuleMeta = {
  canBeNegative: false,
  feature: 'default',
  prefix: '',
  styleProperty: undefined,
  suffix: '',
  support: [],
};

export const DEFAULT_TWIN_CONFIG = {
  content: [],
  theme: {},
  darkMode: 'class',
  ignorelist: [],
  mode: 'native',
  preflight: {},
  root: {
    rem: 16,
  },
  rules: [],
  variants: [],
  animations: [],
} as InternalTwinConfig;

export const DEFAULT_PLUGIN_CONFIG = {
  jsxAttributes: ['tw', 'class', 'className', 'variants'],
  functions: ['tw', 'apply', 'css', 'variants', 'style', 'styled', 'createVariants'],
  debug: false,
  enable: true,
  trace: {
    server: 'off',
  } as const,
};

export type NativeTwinPluginConfiguration = typeof DEFAULT_PLUGIN_CONFIG;

export const typeScriptExtensionId = 'vscode.typescript-language-features';
export const pluginId = '@native-twin/ts-plugin';
const packageName = 'native-twin-vscode';
const publisher = 'native-twin';
export const extensionChannelName = 'Native Twin Language Client';
export const extensionServerChannelName = 'Native Twin Language Server';
export const extensionName = `${publisher}.${packageName}`;
export const diagnosticProviderSource = 'NativeTwin';
