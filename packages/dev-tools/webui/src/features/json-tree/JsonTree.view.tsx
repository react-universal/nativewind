import type { RawJSXElementTreeNode } from '@native-twin/css/jsx';
import type { HierarchyPointNode } from 'd3-hierarchy';
import { select as d3Select } from 'd3-selection';
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import { Circle, G, Rect, Text } from 'react-native-svg';
import type { SvgPoint } from './json.types';

interface TreeNodeViewProps {
  index: number;
  radius: number;
  origin: SvgPoint;
  node: HierarchyPointNode<RawJSXElementTreeNode>;
  onClick: (node: RawJSXElementTreeNode) => void;
}

export const TreeNodeView = ({
  node,
  origin,
  onClick,
  radius,
  index,
}: TreeNodeViewProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      const element = d3Select(`#node-circle-${index}`);
      console.log('ELL: ', element);
      element.on('pointerover', () => {
        console.log('pointerover');
        setShowDetails(true);
      });
      element.on('pointerout', () => {
        console.log('pointerout');
        setShowDetails(false);
      });
      element.on('click', () => {
        console.log('CLICK');
        onClick(node.data);
      });
    }
  }, []);

  return (
    <G ref={ref} fontFamily='serif' id={`node-circle-${index}`}>
      <Circle cx={origin.x} cy={origin.y} r={radius} fill='#2951a7' />
      <Text
        fill='#FFFFFF'
        x={origin.x}
        textAnchor='middle'
        y={origin.y + 2}
        fontSize={10}
        className='font-inter-medium'
      >
        {`${node.data.jsxElementName} #${index}`}
      </Text>
      {showDetails && (
        <G fontFamily='serif'>
          <Rect
            rx={10}
            ry={10}
            width={radius * 2}
            height={radius * 2}
            x={origin.x}
            y={origin.y}
            fill='#000000'
            stroke='#CCCCCC'
          />
          <Text
            fill='#FFFFFF'
            x={origin.x + radius}
            textAnchor='middle'
            y={origin.y + radius}
            fontSize={10}
            className='font-inter-medium'
            fontStretch='ultra-condensed'
            lengthAdjust='spacingAndGlyphs'
            // textLength={`${radius * 2}px`}
          >
            {`${node.data.source}`}
          </Text>
        </G>
      )}
    </G>
  );
};
