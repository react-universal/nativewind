import type { RawJSXElementTreeNode } from '@native-twin/css/jsx';
import type { Table } from '@tanstack/react-table';
import type { UnknownOutputParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { TableCell } from './components/TableCell';
import { TableHeaderCell } from './components/TableHeaderCell';
import { useHomeScreen } from './useHomeScreen';

export function HomeScreen() {
  const { table, params } = useHomeScreen();
  return (
    <View className='w-full p-2 overflow-scroll'>
      <View className='flex-row gap-10'>
        <ComponentsTable params={params} table={table} />
        <View className=''>
          <Pressable className='transition-all duration-1000 hover:rounded-sm border(1 green-600) p-2 rounded-xl'>
            <Text className='hover:text-red transition-colors'>Show generated CSS</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const ComponentsTable = ({
  table,
  params,
}: {
  table: Table<RawJSXElementTreeNode>;
  params: UnknownOutputParams;
}) => {
  return (
    <table
      className='flex-1 w-full'
      style={{
        width: table.getCenterTotalSize(),
      }}
    >
      <thead className='w-full'>
        {table.getHeaderGroups().map((headerGroups) => {
          return (
            <tr key={headerGroups.id} className='flex-row border-1'>
              {headerGroups.headers.map((header) => (
                <TableHeaderCell key={header.id} {...header} />
              ))}
            </tr>
          );
        })}
      </thead>
      <tbody className='w-full'>
        {table.getRowModel().rows.map((row) => {
          return (
            <tr key={row.id} className='flex-row'>
              {row.getVisibleCells().map((cell) => {
                return <TableCell params={params} key={cell.id} cell={cell} />;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
