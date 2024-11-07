import { RuntimeComponentEntry } from '@native-twin/css/jsx';
import { TreeNode } from '@native-twin/helpers/tree';
import { JSXElementNode, JSXElementTree } from '../models';
import { extractMappedAttributes } from './twin-jsx.utils';

export const jsxTreeNodeToJSXElementNode = (
  leave: TreeNode<JSXElementTree>,
  entries: RuntimeComponentEntry[],
  filename: string,
): JSXElementNode => {
  const runtimeData = extractMappedAttributes(leave.value.babelNode);
  return new JSXElementNode({
    leave,
    order: leave.value.order,
    filename,
    runtimeData,
    entries,
  });
};
