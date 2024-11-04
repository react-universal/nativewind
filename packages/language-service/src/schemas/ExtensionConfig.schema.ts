import * as Schema from 'effect/Schema';
import { DEFAULT_PLUGIN_CONFIG } from '../utils/constants.utils';

const TwinFileConfigSchemaString = Schema.String;
const TwinFileConfigSchemaPaths = Schema.Array(TwinFileConfigSchemaString);

const TwinFunctionItem = Schema.String.annotations({
  type: 'string',
  description: 'Function/Tag name.',
});
const TwinFunctions = Schema.Array(TwinFunctionItem).annotations({
  description:
    'List of template tagged expressions or functions to enable Native Twin intellisense in.',
  title: 'Function expressions to validate',
  default: DEFAULT_PLUGIN_CONFIG.functions,
});

const TwinJSXAttributesItem = Schema.String.annotations({
  type: 'string',
  description: 'Attribute name.',
});
const TwinJSXAttributes = Schema.Array(TwinJSXAttributesItem).annotations({
  description: 'List of html/jsx attributes to enable Native Twin intellisense in.',
  title: 'Function expressions to validate',
  default: DEFAULT_PLUGIN_CONFIG.jsxAttributes,
});

const TwinDebugEnabled = Schema.Boolean.annotations({
  title: 'Enable debug logs',
  description: 'Enable/disable additional debug information.',
});

const TwinEnabled = Schema.Boolean.annotations({
  title: 'Enable Native Twin',
  description: 'Controls whether Native Twin intellisense is enabled or not.',
});

const NativeTwinTrace = Schema.Struct({
  server: Schema.Literal('off', 'messages', 'verbose'),
}).annotations({
  description: 'Traces the communication between VS Code and the language server.',
  default: DEFAULT_PLUGIN_CONFIG.trace,
});

export const ExtensionConfigSchema = Schema.Struct({
  $schema: Schema.String,
  twinConfigPath: Schema.Union(TwinFileConfigSchemaPaths, TwinFileConfigSchemaString),
  functions: TwinFunctions,
  jsxAttributes: TwinJSXAttributes,
  debug: TwinDebugEnabled,
  enable: TwinEnabled,
  trace: NativeTwinTrace,
});
