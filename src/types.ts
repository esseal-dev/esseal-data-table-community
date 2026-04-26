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

// ─── Server-side pagination ───────────────────────────────────────────────────

export interface ServerRequestParams {
  page: number;
  pageSize: number;
  sortModel: SortModel | null;
  filterModel: FilterModel;
  /** 'first' on mount, filter change, sort change, page-size change.
   *  'next'/'prev' on explicit page navigation only.
   *  Cursor consumers use this to decide which cursor to send. */
  direction: 'first' | 'next' | 'prev';
}

type PaginationClientMode = {
  paginationMode?: 'client';
  rowCount?: never;
  onServerRequest?: never;
  filterDebounceMs?: never;
};

type PaginationServerMode = {
  paginationMode: 'server';
  /** Total row count from the server — drives footer display and page count. */
  rowCount: number;
  onServerRequest: (params: ServerRequestParams) => void;
  /** Debounce delay for filter input changes in ms. Default: 300. */
  filterDebounceMs?: number;
};

export type PaginationConfig = PaginationClientMode | PaginationServerMode;

// ─── Server-side grouping ─────────────────────────────────────────────────────

export interface ServerGroupValue {
  value: string;
  count: number;
}

export interface ServerGroupDef<T> {
  field: keyof T | string;
  groups: ServerGroupValue[];
}

export interface LoadGroupDataParams {
  /** Internally generated group ID — the __field-value chain. */
  groupId: string;
  /** Number of rows already loaded in this group. Use as offset for offset-based backends. */
  currentlyLoaded: number;
  /** Last cursor received for this group. Empty string on first load. */
  cursor: string;
}

export interface LoadGroupDataResult<T> {
  rows: T[];
  /** Omit or pass empty string to signal no more pages (hides the load-more button). */
  nextCursor?: string;
}

type ClientGroupingConfig<T> = {
  groupBy?: (keyof T)[];
  serverGroups?: never;
  onLoadGroupData?: never;
};

type ServerGroupingConfig<T> = {
  groupBy?: never;
  serverGroups: ServerGroupDef<T>[];
  onLoadGroupData: (params: LoadGroupDataParams) => Promise<LoadGroupDataResult<T>>;
};

export type GroupingConfig<T> = ClientGroupingConfig<T> | ServerGroupingConfig<T>;

// ─── Base props ───────────────────────────────────────────────────────────────

type DataGridBaseProps<T> = {
  rows: T[];
  columns: GridColDef<T>[];
  rowHeight?: number;
  height?: number | string;
  loading?: boolean;
  initialState?: Partial<TableState>;
  onStateChange?: (state: TableState) => void;
  rowActions?: (row: T) => GridAction<T>[];
  maxVisibleActions?: number;
  checkboxSelection?: boolean;
  pagination?: boolean;
  /** Pass a number array to show a page-size selector in the footer. */
  pageSize?: number | number[];
  disableColumnMenu?: boolean;
  toolbar?: ReactNode;
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
  getRowClassName?: (row: T) => string;
} & PaginationConfig & GroupingConfig<T>;

// If the row type has an `id` field, getRowId is optional.
// If it doesn't, getRowId is required — enforced at compile time.
export type DataGridProps<T> = DataGridBaseProps<T> &
  (T extends { id: string | number }
    ? { getRowId?: (row: T) => string | number }
    : { getRowId: (row: T) => string | number });

// ─── Internal node types ──────────────────────────────────────────────────────

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

export type LoadMoreNode = {
  type: 'load-more';
  groupId: string;
  state: 'loading' | 'idle' | 'error';
};
