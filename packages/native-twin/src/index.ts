import { defineConfig } from './config/define-config.js';
import { convert } from './convert/convertRule.js';
import { parsedRuleToEntry } from './convert/ruleToEntry.js';
import { createTailwind } from './native-twin.js';
import { parseCssValue } from './parsers/values.parser.js';
import { cx } from './runtime/cx.js';
import { install } from './runtime/install.js';
import { mutationObserver } from './runtime/mutation-observer.js';
import { consume, extract } from './runtime/ssr.js';
import { observe, setup, tw } from './runtime/tw.js';
import { tx } from './runtime/tx.js';
import { createVariants } from './runtime/variants.js';
import { createThemeContext } from './theme/theme.context.js';
import { createThemeFunction } from './theme/theme.function.js';
import {
  matchAnimation,
  matchCssObject,
  matchThemeColor,
  matchThemeValue,
} from './theme/theme.match.js';

/** TYPES */
export type { ExtractResult } from './runtime/ssr.js';
export type { TxFunction } from './runtime/tx.js';
export type { ConfigVariants, VariantProps, VariantsConfig } from './runtime/variants.js';
export type * from './types/config.types.js';
export type * from './types/theme.types.js';
export type { PropsFrom } from '@native-twin/helpers';

export {
  tw,
  tx,
  cx,
  parseCssValue,
  createThemeContext,
  createThemeFunction,
  matchCssObject,
  matchThemeColor,
  matchThemeValue,
  matchAnimation,
  createVariants,
  createTailwind,
  install,
  setup,
  observe,
  consume,
  extract,
  mutationObserver,
  parsedRuleToEntry,
  convert,
  defineConfig,
};

export {
  type TwinRuntimeProp,
  getSheetEntryStyles,
  sheetEntryToStyle,
  composeDeclarations,
} from './runtime/SheetHandler.js';

export type { TwinRuntimeContext, Units } from './runtime/runtime.context.js';

export {
  StyleSheetAdapter,
  type StyleSheetProcessor,
} from './runtime/TwinStyleSheet.js';
