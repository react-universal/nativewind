import type { RawJSXElementTreeNode } from '@native-twin/css/jsx';
import { type Cell, flexRender } from '@tanstack/react-table';
import type { UnknownOutputParams } from 'expo-router';

interface CellProps {
  cell: Cell<RawJSXElementTreeNode, unknown>;
  params: UnknownOutputParams;
}
export const TableCell = ({ cell, params }: CellProps) => {
  return (
    <td
      key={cell.id}
      style={{
        width: cell.column.getSize(),
      }}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );
};
