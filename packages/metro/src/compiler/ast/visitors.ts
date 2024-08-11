import * as RA from 'effect/Array';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import { Identifier, ts } from 'ts-morph';
import { JSXElementSheet } from '@native-twin/css/jsx';
import { JSXElementNode } from '../models/JSXElement.model';
import { entriesToObject, getImportDeclaration } from '../ts/ts.constructors';
import { addAttributeToJSXElement } from './ast.matchers';

export function visitElementNode(node: JSXElementNode, sheet: JSXElementSheet) {
  const componentEntries = entriesToObject(
    node.id,
    pipe(
      sheet.propEntries,
      RA.map((prop) => {
        return {
          ...prop,
          rawSheet: {
            ...prop.rawSheet,
            even: [],
            first: [],
            last: [],
            odd: [],
          },
        };
      }),
    ),
  );

  addAttributeToJSXElement(node.path, '_twinOrd', node.order);
  addAttributeToJSXElement(node.path, '_twinComponentID', `"${node.id}"`);
  addAttributeToJSXElement(
    node.path,
    '_twinComponentTemplateEntries',
    `${componentEntries.templateEntries}`,
  );
  addAttributeToJSXElement(node.path, '_twinComponentSheet', componentEntries.styledProp);

  return { node, sheet, rawEntries: RA.flatMap(sheet.propEntries, (x) => x.entries) };
}

export const maybeReactNativeImport = (
  ident: Identifier,
): Option.Option<ts.ImportDeclaration> => {
  return Option.fromNullable(getImportDeclaration(ident)).pipe(
    Option.flatMap((x) => {
      const moduleSpecifier = x.moduleSpecifier;
      if (!ts.isStringLiteral(moduleSpecifier)) return Option.none();
      if (moduleSpecifier.text !== 'react-native') return Option.none();

      return Option.some(x);
    }),
  );
};
