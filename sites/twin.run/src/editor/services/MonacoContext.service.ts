import * as vscode from 'vscode';
import * as t from '@babel/types';
import { transformFromAstAsync } from '@babel/core';
import { sheetEntriesToCss } from '@native-twin/css';
import {
  Constants,
  NativeTwinManagerService,
  TwinMonacoTextDocument,
  traverseLanguageRegions,
} from '@native-twin/language-service/browser';
import * as RA from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import type { NodePath } from '@babel/core';
import { cx } from '@native-twin/core';
import { asArray } from '@native-twin/helpers';
import { getMonacoWrapperConfig } from '../../utils/wrapper.utils';

const make = Effect.gen(function* () {
  const twin = yield* NativeTwinManagerService;
  const wrapper = new MonacoEditorLanguageClientWrapper();
  const { workspace, config } = yield* getMonacoWrapperConfig;
  wrapper.getMonacoEditorApp();

  return {
    workspace,
    config,
    wrapper,
    getDocumentPreview,
    initEditor: () => Effect.promise(() => wrapper.init(config)),
    openTextDocument: (uri: vscode.Uri) =>
      Effect.promise(() => vscode.workspace.openTextDocument(uri)),
    getMonacoApp: () => Effect.fromNullable(wrapper.getMonacoEditorApp()),
  };

  async function getDocumentPreview(document: vscode.TextDocument) {
    const twinDocument = new TwinMonacoTextDocument(
      document,
      Constants.DEFAULT_PLUGIN_CONFIG,
    );
    const regions = twinDocument.getLanguageRegions();
    const entries = RA.flatMap(regions, (x) => twin.tw(`${x.text}`));
    const code = await Effect.runPromise(transformDocument(document.getText()));

    return {
      code,
      regions,
      extracted: entries,
      css: sheetEntriesToCss(twin.tw.target),
    };
  }
});

const transformDocument = (code: string): Effect.Effect<string> =>
  Effect.gen(function* () {
    const { ast, babelRegions } = yield* traverseLanguageRegions(
      code,
      Constants.DEFAULT_PLUGIN_CONFIG,
    );
    yield* babelRegions.pipe(
      Stream.map((x) => {
        if (x.path.isCallExpression()) {
          for (const arg of x.path.get('arguments')) {
            if (arg.isObjectProperty(arg)) {
              transformVariantObjects(arg);
            }
          }
        }
        if (x.path.isTaggedTemplateExpression()) {
          transformTemplateLiteral(x.path.get('quasi'));
        }
        if (x.path.isJSXAttribute()) {
          const name = x.path.get('name');
          const value = x.path.get('value');
          if (
            value &&
            name.isJSXIdentifier() &&
            Constants.DEFAULT_PLUGIN_CONFIG.jsxAttributes.includes(name.node.name)
          ) {
            if (value.isStringLiteral()) {
              value.replaceWith(t.stringLiteral(cx`${value.node.value}`));
            }
            if (value.isJSXExpressionContainer()) {
              const expression = value.get('expression');
              if (expression.isStringLiteral()) {
                expression.replaceWith(t.stringLiteral(cx`${expression.node.value}`));
              }
            }
          }
        }
      }),
      Stream.runDrain,
    );

    const transformed = yield* Effect.promise(() => transformFromAstAsync(ast));
    return transformed?.code ?? code;
  }).pipe(
    Effect.tapError((error) => Effect.log('ERROR: ', error)),
    Effect.catchAll(() => Effect.succeed(code)),
    Effect.withLogSpan('transformCodeForPreview')
  );

const transformVariantObjects = (
  properties: NodePath<t.ObjectExpression['properties']>[],
) => {
  for (const prop of properties.filter((x) => x.isObjectProperty())) {
    const value = prop.get('value');
    if (Array.isArray(value)) continue;
    if (value.isStringLiteral()) {
      value.replaceWith(t.stringLiteral(cx`${value.node.value}`));
    }
    if (value.isTemplateLiteral()) {
      transformTemplateLiteral(value);
    }
    if (value.isObjectExpression()) {
      transformVariantObjects(
        asArray(value.get('properties').filter((x) => x.isObjectExpression())),
      );
    }
  }
};

const transformTemplateLiteral = (template: NodePath<t.TemplateLiteral>) => {
  for (const templateElement of template.get('quasis')) {
    templateElement.replaceWith(
      t.templateElement({
        raw: cx`${templateElement.node.value.raw}`,
        cooked: cx`${templateElement.node.value.cooked}`,
      }),
    );
  }
};

export interface MonacoContext extends Effect.Effect.Success<typeof make> {}
export const MonacoContext = Context.GenericTag<MonacoContext>('MonacoContext');
export const MonacoContextLive = Layer.scoped(MonacoContext, make);

// TODO: RESTORE BABEL AND MERGE VISITORS
// const ast = parseSync(document.getText(), {
//   parserOpts: {
//     plugins: ['jsx'],
//   },
// });
// let code = document.getText();
// if (ast) {
//   traverse(ast, {
//     JSXAttribute: (path) => {
//       const name = path.get('name');
//       const value = path.get('value');
//       if (
//         value &&
//         name.isJSXIdentifier() &&
//         Constants.DEFAULT_PLUGIN_CONFIG.jsxAttributes.includes(name.node.name)
//       ) {
//         console.log('ATTR: ', path.node.name);
//         if (value.isStringLiteral()) {
//           value.replaceWith(t.stringLiteral(cx`${value.node.value}`));
//         }
//       }
//     },
//   });
//   const transformed = transformFromAstSync(ast);
//   if (transformed?.code) {
//     code = transformed.code;
//   }
// }
