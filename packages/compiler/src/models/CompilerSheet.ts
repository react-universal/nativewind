import { StyleSheetAdapter } from '@native-twin/core';
import type { SheetEntry } from '@native-twin/css';
import {
  type CompilerContext,
  type RuntimeSheetDeclaration,
  compileEntryDeclaration,
  mergeCompiledDeclarations,
} from '@native-twin/css/jsx';
import type { InternalTwFn, InternalTwinConfig } from './Twin.models';

export class CompilerStyleSheet extends StyleSheetAdapter<InternalTwinConfig> {
  constructor(
    readonly ctx: CompilerContext,
    readonly twinFn: InternalTwFn,
    debug: boolean,
  ) {
    super(debug);
  }

  toRuntimeDecls(entries: SheetEntry[]): RuntimeSheetDeclaration[] {
    return entries
      .flatMap((x) => x.declarations)
      .map((x) => compileEntryDeclaration(x, this.ctx));
  }

  toNativeStyles(entries: SheetEntry[]) {
    const declarations = this.toRuntimeDecls(entries);
    return mergeCompiledDeclarations(declarations);
  }
}
