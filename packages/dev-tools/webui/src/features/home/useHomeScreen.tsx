import { PLUGIN_EVENTS } from '@/constants/event.constants';
import {
  componentsStore,
  getComponentsSize,
  setTreeComponent,
} from '@/features/app/store/components.store';
import { useClientSubscription } from '@/features/app/useDevToolsClient';
import type { RawJSXElementTreeNode } from '@native-twin/css/jsx';
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import * as RA from 'effect/Array';
import { pipe } from 'effect/Function';
import { useGlobalSearchParams } from 'expo-router';
import { useMemo, useSyncExternalStore } from 'react';
import { TableLink } from './components/TableLinkCell';

export const useHomeScreen = () => {
  const params = useGlobalSearchParams();
  const columnHelper = createColumnHelper<RawJSXElementTreeNode>();
  const componentsSize = useSyncExternalStore(
    componentsStore.subscribe,
    () => {
      // console.log('SIZE: ', getComponentsSize());
      return getComponentsSize();
    },
    () => getComponentsSize(),
  );
  const componentsData = useMemo(
    () =>
      componentsSize === 0
        ? []
        : pipe(componentsStore.getState(), (x) => x.values(), RA.fromIterable),
    [componentsSize],
  );
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: () => 'ID',
        enableSorting: true,
        cell: (props) => props.cell.getValue().split('_')[0],
      }),
      columnHelper.accessor('importKind', {
        header: () => 'Import Kind',
        cell: (props) => props.cell.getValue(),
      }),
      columnHelper.accessor('order', {
        header: () => 'Order',
        cell: (props) => props.cell.getValue(),
      }),
      columnHelper.accessor('jsxElementName', {
        header: () => 'Open',
        cell: (props) => <TableLink cell={props.cell} params={params} />,
      }),
    ],
    [columnHelper, params],
  );

  const table = useReactTable({
    columns,
    data: componentsData,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: false,
  });

  useClientSubscription<RawJSXElementTreeNode>(PLUGIN_EVENTS.receiveTree, (_, tree) => {
    setTreeComponent(tree);
  });

  return {
    table,
    params,
  };
};
