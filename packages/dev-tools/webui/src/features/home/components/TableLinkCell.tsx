import type { RawJSXElementTreeNode } from '@native-twin/css/jsx';
import type { Cell } from '@tanstack/react-table';
import { Link, type UnknownOutputParams } from 'expo-router';
import { View } from 'react-native';

interface CellProps {
  cell: Cell<RawJSXElementTreeNode, unknown>;
  params: UnknownOutputParams;
}
export const TableLink = ({ cell, params }: CellProps) => (
  <View key={cell.id} className={`border-l-1 w-[${cell.column.getSize()}px]`}>
    <Link
      href={{
        pathname: `/file-tree/${cell.row.original.id}`,
        params: {
          id: cell.row.original.id,
          order: cell.row.original.order,
          ...params,
        },
      }}
    >
      Open Tree
    </Link>
  </View>
);
