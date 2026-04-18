import type { ReactNode } from 'react';

export interface GridRenderCellParams<T = any> {
  value: any;
  row: T;
  field: string;
}

export interface GridColDef<T = any> {
  field: keyof T | string;
  headerName: string;
  width: number;
  pinned?: 'left' | 'right' | false;
  hide?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  valueGetter?: (row: T) => string | number;
  renderCell?: (params: GridRenderCellParams<T>) => ReactNode;
  cellClassName?: (row: T) => string;
}

export interface GridAction<T> {
  label: string;
  icon?: ReactNode;
  tooltipText?: string;
  onClick: (row: T) => void;
  disabled?: boolean;
}

export type SortDirection = 'asc' | 'desc';
export type PinDirection = 'left' | 'right' | false;

export interface SortModel {
  field: string;
  direction: SortDirection;
}

export interface FilterModel {
  [field: string]: string;
}

export interface TableState {
  page: number;
  sortModel: SortModel | null;
  filterModel: FilterModel;
  expandedGroups: Record<string, boolean>;
  columnVisibility: Record<string, boolean>;
  pinnedColumns: Record<string, PinDirection>;
}

type DataGridBaseProps<T> = {
  rows: T[];
  columns: GridColDef<T>[];
  groupBy?: (keyof T)[];
  rowHeight?: number;
  height?: number | string;
  loading?: boolean;
  initialState?: Partial<TableState>;
  onStateChange?: (state: TableState) => void;
  rowActions?: (row: T) => GridAction<T>[];
  maxVisibleActions?: number;
  checkboxSelection?: boolean;
  pagination?: boolean;
  pageSize?: number;
  disableColumnMenu?: boolean;
  toolbar?: ReactNode;
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
  getRowClassName?: (row: T) => string;
};

// If the row type has an `id` field, getRowId is optional.
// If it doesn't, getRowId is required — enforced at compile time.
export type DataGridProps<T> = DataGridBaseProps<T> &
  (T extends { id: string | number }
    ? { getRowId?: (row: T) => string | number }
    : { getRowId: (row: T) => string | number });

// Internal node types
export type GroupNode<T> = {
  type: 'group';
  id: string;
  field: keyof T;
  value: string;
  depth: number;
  count: number;
  children: (GroupNode<T> | RowNode<T>)[];
};

export type RowNode<T> = {
  type: 'row';
  id: string | number;
  data: T;
};
