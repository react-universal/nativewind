import type { RawJSXElementTreeNode } from '@native-twin/css/jsx';
import { type HierarchyPointNode, tree as d3Tree, hierarchy } from 'd3-hierarchy';
import { type DefaultLinkObject, linkHorizontal, linkVertical } from 'd3-shape';
import * as RA from 'effect/Array';
import { apply, flip, identity, pipe } from 'effect/Function';
import * as Record from 'effect/Record';
import * as Tuple from 'effect/Tuple';
import type { SvgPoint } from './json.types';

interface TreeLayoutParams {
  width: number;
  height: number;
  nodeSize: number;
}
const verticalConfig = (layout: TreeLayoutParams) => {
  const treeSize = Tuple.make<[width: number, height: number]>(
    layout.width / 2,
    layout.height / 2,
  );
  const nodeSize = Tuple.make<[width: number, height: number]>(
    layout.nodeSize,
    layout.nodeSize,
  );

  const svgCenter = Tuple.make<[x: number, y: number]>(
    layout.width / 2,
    layout.height / 2,
  );

  return {
    treeSize,
    nodeSize,
    svgCenter,
  };
};

const swapTupleIf = flip(
  <A>(tuple: [a: A, b: A]) =>
    (swap: boolean): [a: A, b: A] | [b: A, a: A] => {
      return pipe(Tuple.make(...tuple), (x) => (!swap ? identity(x) : Tuple.swap(x)));
    },
);

export const createComponentsTree = (
  layout: TreeLayoutParams,
  orientation: 'row' | 'col' = 'row',
) => {
  const vertical = verticalConfig(layout);
  const horizontal: typeof vertical = pipe(
    vertical,
    Record.set('nodeSize', Tuple.swap(...[vertical.nodeSize])),
    Record.set('treeSize', Tuple.swap(...[vertical.treeSize])),
    Record.set('svgCenter', Tuple.swap(...[vertical.svgCenter])),
  );

  const treeConfig = orientation === 'col' ? vertical : horizontal;

  const tree = d3Tree<RawJSXElementTreeNode>()
    .size(treeConfig.treeSize)
    .nodeSize(treeConfig.nodeSize);

  const nodeSize = { width: treeConfig.nodeSize[0], height: treeConfig.nodeSize[1] };
  const centerX = pipe(
    Tuple.make(treeConfig.svgCenter[0], treeConfig.svgCenter[1]),
    swapTupleIf(orientation === 'row'),
  );
  const svgCenter: SvgPoint = {
    x: centerX[0],
    y: centerX[1],
  };

  const radius = treeConfig.nodeSize[0];

  const calcNodeOrigin = (from: SvgPoint): SvgPoint => {
    const xy = pipe(
      Tuple.make<[x: number, y: number]>(
        svgCenter.x + from.x * 3,
        nodeSize.height + from.y * 3,
      ),
      swapTupleIf(orientation === 'row'),
    );

    return {
      x: xy[0],
      y: xy[1],
    };
  };

  const getLinks = (rootNode: HierarchyPointNode<RawJSXElementTreeNode>) => {
    return pipe(
      rootNode.links(),
      RA.flatMap((link) => {
        const sourceX = svgCenter.x + link.source.x * 3;
        const sourceY = link.source.y * 3 + nodeSize.height * 2;
        const targetX = svgCenter.x + link.target.x * 3;
        const targetY = link.target.y * 3;
        const fn = orientation === 'col' ? linkVertical() : linkHorizontal();
        const line = pipe(
          (x: DefaultLinkObject) => fn(x),
          apply({
            source: pipe(
              Tuple.make(sourceX, sourceY),
              swapTupleIf(orientation === 'row'),
            ),
            target: pipe(
              Tuple.make(targetX, targetY),
              swapTupleIf(orientation === 'row'),
            ),
          }),
        );
        if (!line) return [];
        return [line];
      }),
    );
  };

  return (jsxElement: RawJSXElementTreeNode) => {
    const rootNode = hierarchy<RawJSXElementTreeNode>(jsxElement, (d) => {
      return d.childs;
    });

    const treeLayout = tree(rootNode);

    return {
      treeLayout,
      nodeSize,
      rootNode,
      radius,
      getLinks,
      calcNodeOrigin,
      orientation,
    };
  };
};
