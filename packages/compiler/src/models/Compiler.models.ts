import type { InjectableEntry } from '@native-twin/css';
import CodeBlockWriter from 'code-block-writer';
import * as Array from 'effect/Array';
import type * as Data from 'effect/Data';
import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';
import type * as LogLevel from 'effect/LogLevel';
import * as Option from 'effect/Option';
import { runtimeEntriesToAst } from '../utils/babel/babel.jsx';
import { addJsxAttribute, addJsxExpressionAttribute } from '../utils/babel/babel.utils';
import { expressionFactory } from '../utils/babel/writer.factory';
import type { CompiledMappedProp, TwinBabelJSXElement } from './Babel.models';

export class TwinCompiledElement implements Equal.Equal {
  constructor(
    readonly babel: TwinBabelJSXElement,
    readonly props: Iterable<CompiledMappedProp>,
    readonly childs: Iterable<TwinCompiledElement>,
  ) {}

  get id(): number {
    const index = Hash.number(this.babel.index);
    const name = Hash.string(
      this.babel.jsxName.pipe(
        Option.map((x) => x.name),
        Option.getOrElse(() => 'Unknown'),
      ),
    );
    const filename = this.babel.location.pipe(
      Option.map((x) => x.filename),
      Option.getOrElse(() => 'NO_FILE'),
    );

    return Hash.string(`${filename}-${name}-${index}`);
  }

  runtimeEntriesToCode() {
    const result = Array.fromIterable(this.props)
      .map((x) => this.compiledPropToCode(x))
      .join(',');
    return `[${result}]`;
  }

  mutateBabelAST() {
    const code = this.runtimeEntriesToCode();
    const astProps = runtimeEntriesToAst(code);

    addJsxAttribute(this.babel.babelNode, '_twinComponentID', `${this.id}`);
    addJsxAttribute(this.babel.babelNode, '_twinOrd', this.babel.index);

    if (astProps) {
      addJsxExpressionAttribute(this.babel.babelNode, '_twinInjected', astProps);
    }
    return {
      astProps,
      code,
    };
  }

  private compiledPropToCode(compiledProp: CompiledMappedProp) {
    const id = this.id;
    const w = expressionFactory(new CodeBlockWriter());
    const entries = Array.fromIterable(compiledProp.entries).map(
      (entry): InjectableEntry => ({
        className: entry.className,
        declarations: entry.runtimeDeclarations,
        group: entry.selectorGroup(),
        important: entry.important,
        precedence: entry.precedence,
        style: entry.styles,
      }),
    );
    const templateEntries = compiledProp.templateExpression.pipe(
      Option.flatMap(
        Option.liftPredicate(
          (template) => template.length > 0 && template.replaceAll(/`/g, '').length > 0,
        ),
      ),
      Option.getOrNull,
    );

    w.writer.block(() => {
      w.writer.writeLine(`id: "${id}",`);
      w.writer.writeLine(`target: "${compiledProp.target}",`);
      w.writer.writeLine(`prop: "${compiledProp.prop}",`);
      w.writer.write('entries: ');
      w.array(entries).write(',');
      // w.writer.writeLine(`templateLiteral: ${entry.templateLiteral},`);
      w.writer.writeLine(`templateEntries: ${templateEntries},`);
      // w.writer.write('rawSheet: ');
      // w.object(entry.rawSheet).write(',');
    });
    return w.writer.toString();
  }

  [Hash.symbol](): number {
    return this.id;
  }
  [Equal.symbol](that: unknown) {
    return that instanceof TwinCompiledElement && this.id === that.id;
  }
}

/**
 * @domain `TwinNodeContext` Common Input config options
 */
export interface NodeWithNativeTwinOptions {
  /**
   * Must be absolute
   * @example ```js
   * __dirname
   * ```
   * */
  projectRoot?: string | undefined;
  /**
   * Must be absolute
   * @example ```js
   * path.join(__dirname, 'public/out.css')
   * ```
   * */
  outputDir?: string | undefined;
  twinConfigPath: string;
  /**
   * Must be absolute
   * @example ```js
   * path.join(__dirname, 'globals.css')
   * ```
   * */
  inputCSS?: string | undefined;
  /**
   * @default `INFO`
   * */
  logLevel: LogLevel.Literal;
}

export interface TwinPathInfo {
  absolute: string;
  relative: string;
}
export type TwinFileInfo = Data.TaggedEnum<{
  File: { readonly path: TwinPathInfo; name: string; dirname: string };
  Directory: { readonly path: TwinPathInfo };
  Glob: { readonly path: TwinPathInfo };
}>;
