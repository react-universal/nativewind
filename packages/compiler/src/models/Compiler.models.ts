import type { NodePath } from '@babel/core';
import { parseExpression } from '@babel/parser';
import type * as t from '@babel/types';
import type {
  RuntimeJSXStyle,
  RuntimeTwinMappedProp,
  SheetEntryHandler,
  TwinInjectedObject,
} from '@native-twin/css/jsx';
import CodeBlockWriter from 'code-block-writer';
import * as RA from 'effect/Array';
import * as Chunk from 'effect/Chunk';
import * as Hash from 'effect/Hash';
import * as Iterable from 'effect/Iterable';
import type * as LogLevel from 'effect/LogLevel';
import * as Option from 'effect/Option';
import { addJsxExpressionAttribute } from '../utils/babel/babel.utils';
import { expressionFactory } from '../utils/babel/writer.factory';
import type { CompiledMappedProp } from './Babel.models';

export class TwinElement {
  constructor(
    readonly babelPath: NodePath<t.JSXElement>,
    private readonly mappedProps: Chunk.Chunk<CompiledMappedProp>,
    readonly meta: {
      readonly parentStyles: Iterable<SheetEntryHandler>;
      readonly parentSize: number;
      readonly parentID: string;
      readonly index: -1 | (number & {});
    },
  ) {}

  get childEntries() {
    return Chunk.flatMap(this.mappedProps, (x) => Chunk.fromIterable(x.childEntries));
  }

  get mergedProps() {
    return Iterable.map(this.mappedProps, (attr) => {
      return {
        ...attr,
        entries: Iterable.appendAll(attr.entries, this.meta.parentStyles),
      };
    });
  }

  get name() {
    return Option.liftPredicate(this.babelPath.get('openingElement').get('name'), (x) =>
      x.isJSXIdentifier(),
    ).pipe(
      Option.map((x) => x.node.name),
      Option.getOrElse(() => 'UnknownElementName'),
    );
  }

  get id(): number {
    const index = Hash.number(this.meta.index);
    const name = Hash.string(this.name);
    const filename = Option.fromNullable(this.babelPath.node.loc).pipe(
      Option.map((x) => x.filename),
      Option.getOrElse(() => 'NO_FILE'),
    );

    return Hash.string(`${filename}-${name}-${index}`);
  }

  toRuntimeObject(): TwinInjectedObject {
    const id = this.id;
    const index = this.meta.index;
    const props = this.getRuntimeProps();
    return {
      id: `${id}`,
      index,
      parentSize: this.meta.parentSize,
      childStyles: RA.fromIterable(this.childEntries).map(entryHandlerToInjected),
      parentID: `${this.meta.parentID}`,
      props,
    };
  }

  toRuntimeString() {
    const w = expressionFactory(new CodeBlockWriter());
    const runtimeObject = this.toRuntimeObject();
    const result = RA.fromIterable(runtimeObject.props)
      .map((x) => this.compiledPropToCode(x))
      .join(',');
    w.array(runtimeObject.childStyles).write(',');
    const componentData = `
      id: "${this.id}", 
      index: ${runtimeObject.index}, 
      parentID: "${runtimeObject.parentID}",
      parentSize: ${runtimeObject.parentSize},`;
    const injectString = `{ 
      ${componentData}
      props: [${result}],
      childStyles: ${w.writer.toString()}
    }`;
    const templateEntries = getTemplateEntries(this.mergedProps);
    const templateBuilder = expressionFactory(new CodeBlockWriter());
    templateBuilder.array(templateEntries).write(',');
    const jsxTwinProp = `{
      ${componentData}
      templateEntries: ${templateBuilder.writer.toString()}
    }`;

    return {
      injectString,
      jsxTwinProp,
    };
  }

  private compiledPropToCode(compiledProp: RuntimeTwinMappedProp) {
    const w = expressionFactory(new CodeBlockWriter());

    w.writer.block(() => {
      w.writer.writeLine(`target: "${compiledProp.target}",`);
      w.writer.writeLine(`prop: "${compiledProp.prop}",`);
      w.writer.write('entries: ');
      w.array(compiledProp.entries).write(',');
      // w.writer.writeLine(`templateEntries: ${compiledProp.templateEntries},`);
    });
    return w.writer.toString();
  }

  private getRuntimeProps(): RuntimeTwinMappedProp[] {
    return getRuntimeProps(this.mergedProps);
  }

  toAst() {
    const { injectString, jsxTwinProp } = this.toRuntimeString();
    const twinInjectAst = parseExpression(injectString, {
      sourceType: 'script',
      errorRecovery: true,
    });
    const twinJsxAst = parseExpression(jsxTwinProp, {
      sourceType: 'script',
      errorRecovery: true,
    });

    if (twinInjectAst) {
      const propNames = Iterable.map(this.mergedProps, (x) => x.prop);
      for (const attr of this.babelPath.get('openingElement').get('attributes')) {
        if (!attr.isJSXAttribute()) continue;
        const name = attr.get('name');
        if (!name.isJSXIdentifier()) continue;
        if (!Iterable.contains(propNames, name.node.name)) continue;
        attr.remove();
      }
      addJsxExpressionAttribute(this.babelPath.node, '_twinInjected', twinJsxAst);
    }

    return twinInjectAst;
  }
}

const entryHandlerToInjected = (entry: SheetEntryHandler): RuntimeJSXStyle => ({
  className: entry.className,
  declarations: entry.runtimeDeclarations,
  group: entry.selectorGroup(),
  important: entry.important,
  inherited: entry.inherited,
  // isPointerEntry: entry.isPointerEntry,
  precedence: entry.precedence,
});

const getTemplateEntries = (props: Iterable<CompiledMappedProp>) =>
  RA.filterMap(RA.fromIterable(props), (mapped) => {
    return mapped.templateExpression.pipe(
      Option.flatMap(
        Option.liftPredicate(
          (template) => template.length > 0 && template.replaceAll(/`/g, '').length > 0,
        ),
      ),
      Option.map((template) => ({
        prop: mapped.prop,
        target: mapped.target,
        templateEntries: template,
      })),
    );
  });

const getRuntimeProps = (props: Iterable<CompiledMappedProp>) =>
  RA.map(
    RA.fromIterable(props),
    (mapped): RuntimeTwinMappedProp => ({
      entries: RA.fromIterable(mapped.entries).map(entryHandlerToInjected),
      prop: mapped.prop,
      target: mapped.target,
    }),
  );

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
