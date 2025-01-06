import { TreeNodeView } from '@/features/json-tree/JsonTree.view';
import { useComponentsTree } from '@/features/json-tree/useJsonTree';
import type { RawJSXElementTreeNode } from '@native-twin/css/jsx';
import { select as d3Select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { G, Path, Svg } from 'react-native-svg';

interface JsonTreeSvgViewProps {
  node: RawJSXElementTreeNode;
}
export default function JsonTreeSvgView({ node }: JsonTreeSvgViewProps) {
  const { treeStruct, height, width, linkComponents, nodes, onPressNode } =
    useComponentsTree(node);

  const svgRef = useRef<any>();
  const contentRef = useRef<any>();
  const domRef = useRef<any>();

  useEffect(() => {
    if (domRef.current) {
      const domEl = d3Select(domRef.current);
      const svg = domEl.select('#tree_view_svg');
      const content = domEl.select('#tree_view_content');

      svg.call(d3Zoom().transform, zoomIdentity.translate(0, 0).scale(1));
      svg.call(
        d3Zoom()
          .scaleExtent([0.1, 2])
          .filter((event) => {
            return (
              event.target.id === 'tree_view_svg' ||
              event.target.id === 'tree_view_content' ||
              event
            );
          })
          .on('zoom', (event) => {
            content.attr('transform', event.transform);
          }),
      );
    }
  }, [treeStruct]);

  if (!treeStruct) return null;
  return (
    <View ref={domRef}>
      <Svg
        ref={svgRef}
        width={width}
        height={height}
        id='tree_view_svg'
        fill='black'
        className='bg-black'
      >
        <G id='tree_view_content' ref={contentRef}>
          {linkComponents.map((line, i) => (
            <Path key={`link-${i}`} d={line} stroke='white' fill='none' />
          ))}
          {nodes.map((node, i) => (
            <TreeNodeView
              key={`node-${node.data.jsxElementName}-${i}`}
              index={i}
              node={node}
              origin={treeStruct.calcNodeOrigin(node)}
              radius={treeStruct.radius}
              onClick={onPressNode}
            />
          ))}
        </G>
        {/* {treeStruct && <TeeView node={treeStruct.struct} />} */}
      </Svg>
    </View>
  );
}
