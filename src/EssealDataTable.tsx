/* eslint-disable */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import './EssealDataTable.css';
import type {
  DataGridProps, GridColDef, PinDirection, SortModel, FilterModel, ServerRequestParams,
} from './types';
import ActionCell from './components/ActionCell';
import { filterRows, sortRows, groupRows, flattenTree } from './utils';
import { useColumnResize } from './hooks/useColumnResize';

export type {
  GridRenderCellParams,
  GridColDef,
  GridAction,
  SortModel,
  FilterModel,
  TableState,
  DataGridProps,
  ServerRequestParams,
  PaginationConfig,
  GroupingConfig,
  ServerGroupDef,
  ServerGroupValue,
  LoadGroupDataParams,
  LoadGroupDataResult,
  LoadMoreNode,
  ExpandableConfig,
} from './types';

const ACTION_BTN_WIDTH = 35;
const ACTION_COL_BASE_WIDTH = 60;

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"></line>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
  </svg>
);

const ExpandIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'block' }}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function EssealDataTable<T>({
  rows,
  columns: initialColumns,
  getRowId,
  groupBy = [],
  rowHeight = 40,
  height = '100%',
  loading = false,
  initialState,
  onStateChange,
  rowActions,
  maxVisibleActions = 1,
  checkboxSelection = false,
  pagination = false,
  pageSize: pageSizeProp = 10,
  disableColumnMenu = false,
  toolbar = undefined,
  onSelectionChange,
  getRowClassName,
  expandable,
  // server pagination
  paginationMode = 'client',
  rowCount,
  onServerRequest,
  filterDebounceMs = 300,
  // server grouping
  serverGroups,
  onLoadGroupData,
}: DataGridProps<T>) {

  const resolveId = useMemo<(row: T) => string | number>(() => {
    if (getRowId) return getRowId;
    return (row: T) => {
      const id = (row as any).id;
      if (id === undefined || id === null) {
        throw new Error(
          '[EssealDataTable] Could not resolve a row ID. ' +
          'Add an `id` field to your row data or provide the `getRowId` prop.'
        );
      }
      return id;
    };
  }, [getRowId]);

  // ── Page size ──────────────────────────────────────────────────────────────
  const pageSizeOptions = Array.isArray(pageSizeProp) ? pageSizeProp : null;
  const [effectivePageSize, setEffectivePageSize] = useState(
    Array.isArray(pageSizeProp) ? pageSizeProp[0] : pageSizeProp
  );

  const [cols, setCols] = useState<GridColDef<T>[]>(initialColumns);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(typeof height === 'number' ? height : 0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
      setContainerHeight(entries[0].contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setCols(prev =>
      initialColumns.map(newCol => {
        const existing = prev.find(c => c.field === newCol.field);
        return existing ? { ...newCol, width: existing.width } : newCol;
      })
    );
  }, [initialColumns]);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    if (initialState?.columnVisibility) return initialState.columnVisibility;
    const defaults: Record<string, boolean> = {};
    initialColumns.forEach(c => { defaults[String(c.field)] = !c.hide; });
    return defaults;
  });

  const [pinnedColumns, setPinnedColumns] = useState<Record<string, PinDirection>>(() => {
    if (initialState?.pinnedColumns) return initialState.pinnedColumns;
    const defaults: Record<string, PinDirection> = {};
    initialColumns.forEach(c => { if (c.pinned) defaults[String(c.field)] = c.pinned; });
    return defaults;
  });

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(initialState?.expandedGroups ?? {});
  const [sortModel, setSortModel] = useState<SortModel | null>(initialState?.sortModel ?? null);
  const [filters, setFilters] = useState<FilterModel>(initialState?.filterModel ?? {});
  const [currentPage, setCurrentPage] = useState(initialState?.page ?? 1);
  const [selection, setSelection] = useState<Set<string | number>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(() =>
    initialState?.expandedRows ? new Set(initialState.expandedRows) : new Set()
  );
  const [scrollTop, setScrollTop] = useState(0);
  const [activeMenuRowId, setActiveMenuRowId] = useState<string | number | null>(null);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const [activePinMenuCol, setActivePinMenuCol] = useState<string | null>(null);
  const pinMenuRef = useRef<HTMLDivElement>(null);

  // ── Server grouping state ──────────────────────────────────────────────────
  const [loadedGroupRows, setLoadedGroupRows] = useState<Record<string, T[]>>({});
  const [groupCursors, setGroupCursors] = useState<Record<string, string>>({});
  const [groupLoadingState, setGroupLoadingState] = useState<Record<string, 'idle' | 'loading' | 'error'>>({});
  const [groupHasMore, setGroupHasMore] = useState<Record<string, boolean>>({});

  // Sort indicator — in server mode only advances after loading completes
  const [committedSortModel, setCommittedSortModel] = useState<SortModel | null>(initialState?.sortModel ?? null);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onStateChangeRef.current = onStateChange; });

  const onServerRequestRef = useRef(onServerRequest);
  useEffect(() => { onServerRequestRef.current = onServerRequest; });

  const onLoadGroupDataRef = useRef(onLoadGroupData);
  useEffect(() => { onLoadGroupDataRef.current = onLoadGroupData; });

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMountFired = useRef(false);
  const prevLoadingRef = useRef(loading);

  // Stable snapshot of current server params — always fresh inside timer callbacks
  const serverParamsRef = useRef<ServerRequestParams>({
    page: initialState?.page ?? 1,
    pageSize: Array.isArray(pageSizeProp) ? pageSizeProp[0] : pageSizeProp,
    sortModel: initialState?.sortModel ?? null,
    filterModel: initialState?.filterModel ?? {},
    direction: 'first',
  });
  serverParamsRef.current = {
    page: currentPage,
    pageSize: effectivePageSize,
    sortModel,
    filterModel: filters,
    direction: 'first',
  };

  // ── onStateChange (existing behavior, unchanged) ───────────────────────────
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onStateChangeRef.current?.({
      page: currentPage,
      sortModel,
      filterModel: filters,
      expandedGroups,
      expandedRows: Array.from(expandedRows),
      columnVisibility,
      pinnedColumns,
    });
  }, [currentPage, sortModel, filters, expandedGroups, expandedRows, columnVisibility, pinnedColumns]);

  // ── Mount fire for server mode ─────────────────────────────────────────────
  useEffect(() => {
    if (paginationMode !== 'server') return;
    if (hasMountFired.current) return;
    hasMountFired.current = true;
    onServerRequestRef.current?.({ ...serverParamsRef.current, direction: 'first' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sort indicator advancement (server mode: wait for loading to finish) ───
  useEffect(() => {
    if (paginationMode !== 'server') {
      setCommittedSortModel(sortModel);
      return;
    }
    if (prevLoadingRef.current === true && loading === false) {
      setCommittedSortModel(sortModel);
    }
    prevLoadingRef.current = loading;
  }, [loading, sortModel, paginationMode]);

  // ── Debounce cleanup on unmount ────────────────────────────────────────────
  useEffect(() => () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  }, []);

  const { handleMouseDown } = useColumnResize<T>(setCols);

  useEffect(() => {
    if (!showColumnMenu && !activePinMenuCol) return;
    const handleClick = (e: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) setShowColumnMenu(false);
      if (pinMenuRef.current && !pinMenuRef.current.contains(e.target as Node)) setActivePinMenuCol(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showColumnMenu, activePinMenuCol]);

  const toggleColumn = (field: string) => setColumnVisibility(prev => ({ ...prev, [field]: !prev[field] }));

  const handlePinColumn = (field: string, direction: PinDirection) => {
    setPinnedColumns(prev => ({ ...prev, [field]: direction }));
    setActivePinMenuCol(null);
  };

  // ── Event handlers ─────────────────────────────────────────────────────────

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...serverParamsRef.current.filterModel, [field]: value };
    setFilters(newFilters);
    setCurrentPage(1);

    if (paginationMode === 'server') {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        onServerRequestRef.current?.({
          page: 1,
          pageSize: serverParamsRef.current.pageSize,
          sortModel: serverParamsRef.current.sortModel,
          filterModel: newFilters,
          direction: 'first',
        });
      }, filterDebounceMs);
    }
  };

  const handleSortChange = (field: string) => {
    const prev = serverParamsRef.current.sortModel;
    const newSort: SortModel = (prev?.field === field && prev.direction === 'asc')
      ? { field, direction: 'desc' }
      : { field, direction: 'asc' };

    setSortModel(newSort);

    if (paginationMode === 'server') {
      setCurrentPage(1);
      if (debounceTimerRef.current) { clearTimeout(debounceTimerRef.current); debounceTimerRef.current = null; }
      onServerRequestRef.current?.({
        page: 1,
        pageSize: serverParamsRef.current.pageSize,
        sortModel: newSort,
        filterModel: serverParamsRef.current.filterModel,
        direction: 'first',
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    const direction = newPage > currentPage ? 'next' : 'prev';
    setCurrentPage(newPage);

    if (paginationMode === 'server') {
      if (debounceTimerRef.current) { clearTimeout(debounceTimerRef.current); debounceTimerRef.current = null; }
      onServerRequestRef.current?.({
        page: newPage,
        pageSize: serverParamsRef.current.pageSize,
        sortModel: serverParamsRef.current.sortModel,
        filterModel: serverParamsRef.current.filterModel,
        direction,
      });
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setEffectivePageSize(newSize);
    setCurrentPage(1);

    if (paginationMode === 'server') {
      if (debounceTimerRef.current) { clearTimeout(debounceTimerRef.current); debounceTimerRef.current = null; }
      onServerRequestRef.current?.({
        page: 1,
        pageSize: newSize,
        sortModel: serverParamsRef.current.sortModel,
        filterModel: serverParamsRef.current.filterModel,
        direction: 'first',
      });
    }
  };

  const handleGroupToggle = async (id: string) => {
    const isExpanding = !expandedGroups[id];
    setExpandedGroups(p => ({ ...p, [id]: !p[id] }));

    if (!isExpanding || !serverGroups) return;
    if (loadedGroupRows[id] !== undefined) return; // already loaded

    setGroupLoadingState(p => ({ ...p, [id]: 'loading' }));
    try {
      const result = await onLoadGroupDataRef.current!({
        groupId: id,
        currentlyLoaded: 0,
        cursor: '',
      });
      setLoadedGroupRows(p => ({ ...p, [id]: result.rows }));
      setGroupCursors(p => ({ ...p, [id]: result.nextCursor ?? '' }));
      setGroupHasMore(p => ({ ...p, [id]: !!result.nextCursor }));
      setGroupLoadingState(p => ({ ...p, [id]: 'idle' }));
    } catch {
      setGroupLoadingState(p => ({ ...p, [id]: 'error' }));
    }
  };

  const handleLoadMore = async (groupId: string) => {
    setGroupLoadingState(p => ({ ...p, [groupId]: 'loading' }));
    try {
      const result = await onLoadGroupDataRef.current!({
        groupId,
        currentlyLoaded: loadedGroupRows[groupId]?.length ?? 0,
        cursor: groupCursors[groupId] ?? '',
      });
      setLoadedGroupRows(p => ({ ...p, [groupId]: [...(p[groupId] ?? []), ...result.rows] }));
      setGroupCursors(p => ({ ...p, [groupId]: result.nextCursor ?? '' }));
      setGroupHasMore(p => ({ ...p, [groupId]: !!result.nextCursor }));
      setGroupLoadingState(p => ({ ...p, [groupId]: 'idle' }));
    } catch {
      setGroupLoadingState(p => ({ ...p, [groupId]: 'error' }));
    }
  };

  // ── Column layout ──────────────────────────────────────────────────────────
  const { sortedCols, gridTemplateColumns } = useMemo(() => {
    const visibleCols = cols.filter(c => columnVisibility[String(c.field)] !== false);
    const pinnedLeft = visibleCols.filter(c => pinnedColumns[String(c.field)] === 'left');
    const pinnedRight = visibleCols.filter(c => pinnedColumns[String(c.field)] === 'right');
    const unpinned = visibleCols.filter(c => !pinnedColumns[String(c.field)] && c.field !== '__checkbox' && c.field !== '__actions');

    if (checkboxSelection) {
      pinnedLeft.unshift({ field: '__checkbox', headerName: '', width: 40, pinned: 'left', sortable: false, filterable: false });
    }
    if (expandable) {
      pinnedLeft.unshift({ field: '__expand', headerName: '', width: 40, pinned: 'left', sortable: false, filterable: false });
    }
    if (rowActions) {
      pinnedRight.push({
        field: '__actions',
        headerName: 'Actions',
        width: ACTION_COL_BASE_WIDTH + maxVisibleActions * ACTION_BTN_WIDTH,
        pinned: 'right',
        sortable: false,
        filterable: false,
      });
    }

    const attachPin = (c: GridColDef<T>, p: 'left' | 'right' | false): GridColDef<T> => ({ ...c, pinned: p });
    const finalCols = [
      ...pinnedLeft.map(c => attachPin(c, 'left')),
      ...unpinned.map(c => attachPin(c, false)),
      ...pinnedRight.map(c => attachPin(c, 'right')),
    ];

    const totalDefined = finalCols.reduce((sum, c) => sum + c.width, 0);
    const extra = containerWidth > 0 && containerWidth > totalDefined
      ? (containerWidth - totalDefined) / finalCols.length
      : 0;
    const expandedCols = extra > 0
      ? finalCols.map(c => ({ ...c, width: Math.floor(c.width + extra) }))
      : finalCols;

    return {
      sortedCols: expandedCols,
      gridTemplateColumns: expandedCols.map(c => `${c.width}px`).join(' '),
    };
  }, [cols, columnVisibility, pinnedColumns, rowActions, maxVisibleActions, checkboxSelection, containerWidth]);

  const valueGetters = useMemo(() => {
    const map: Record<string, (row: T) => any> = {};
    initialColumns.forEach(col => {
      if (col.valueGetter) map[String(col.field)] = col.valueGetter;
    });
    return map;
  }, [initialColumns]);

  // ── Data pipeline ──────────────────────────────────────────────────────────
  const processedRows = useMemo(() => {
    // Server-side grouping path — build flat list from serverGroups + loaded rows
    if (serverGroups) {
      const result: any[] = [];
      serverGroups.forEach(groupDef => {
        groupDef.groups.forEach(groupVal => {
          const groupId = `__${String(groupDef.field)}-${groupVal.value}`;
          result.push({
            type: 'group',
            id: groupId,
            field: groupDef.field as keyof T,
            value: groupVal.value,
            depth: 0,
            count: groupVal.count,
            children: [],
          });

          if (expandedGroups[groupId]) {
            (loadedGroupRows[groupId] ?? []).forEach(row =>
              result.push({ type: 'row', id: resolveId(row), data: row })
            );
            result.push({
              type: 'load-more',
              groupId,
              state: groupLoadingState[groupId] ?? 'idle',
            });
          }
        });
      });
      return result;
    }

    // Client-side path — skip filter/sort in server pagination mode
    const source = paginationMode === 'server'
      ? rows
      : sortRows(filterRows(rows, filters, valueGetters), sortModel, valueGetters);
    const tree = groupRows(source, groupBy as (keyof T)[], valueGetters, resolveId);
    return flattenTree(tree, expandedGroups);
  }, [
    rows, filters, sortModel, groupBy, serverGroups,
    expandedGroups, valueGetters, paginationMode, resolveId,
    loadedGroupRows, groupLoadingState,
  ]);

  const rowsToRender = useMemo(() => {
    if (!pagination || paginationMode === 'server' || serverGroups) return processedRows;
    const start = (currentPage - 1) * effectivePageSize;
    return processedRows.slice(start, start + effectivePageSize);
  }, [processedRows, pagination, paginationMode, serverGroups, currentPage, effectivePageSize]);

  const totalPages = pagination
    ? Math.ceil((paginationMode === 'server' ? (rowCount ?? 0) : processedRows.length) / effectivePageSize)
    : 1;

  const totalContentHeight = rowsToRender.length * rowHeight;
  const anyRowExpanded = expandedRows.size > 0;

  const buffer = 4;
  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.min(rowsToRender.length, Math.floor((scrollTop + containerHeight) / rowHeight) + buffer);
  const visibleRows = anyRowExpanded ? rowsToRender : rowsToRender.slice(startIndex, endIndex);
  const offsetY = anyRowExpanded ? 0 : startIndex * rowHeight;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSel = e.target.checked ? new Set(rows.map(r => resolveId(r))) : new Set<string | number>();
    setSelection(newSel);
    onSelectionChange?.(Array.from(newSel));
  };

  const handleSelectRow = (id: string | number) => {
    const newSel = new Set(selection);
    if (newSel.has(id)) newSel.delete(id); else newSel.add(id);
    setSelection(newSel);
    onSelectionChange?.(Array.from(newSel));
  };

  const handleRowExpand = (rowId: string | number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId); else next.add(rowId);
      return next;
    });
  };

  const getStickyStyle = (index: number) => {
    const col = sortedCols[index];
    const style: React.CSSProperties = {};
    if (col.pinned === 'left') {
      style.left = sortedCols.slice(0, index).reduce((acc, c) => acc + c.width, 0);
      style.position = 'sticky';
      style.zIndex = 2;
    } else if (col.pinned === 'right') {
      style.right = sortedCols.slice(index + 1).reduce((acc, c) => acc + c.width, 0);
      style.position = 'sticky';
      style.zIndex = 2;
    }
    return style;
  };

  const getAriaSort = (field: string): React.AriaAttributes['aria-sort'] => {
    if (committedSortModel?.field !== field) return 'none';
    return committedSortModel.direction === 'asc' ? 'ascending' : 'descending';
  };

  const footerTotal = paginationMode === 'server' ? (rowCount ?? 0) : processedRows.length;

  return (
    <div
      className="dg-container"
      style={{ height }}
      role="grid"
      aria-rowcount={footerTotal}
      aria-colcount={sortedCols.length}
      ref={containerRef}
    >
      {loading && <div className="dg-overlay" role="status" aria-live="polite">Loading data...</div>}

      <div className="dg-toolbar">
        {!disableColumnMenu && (
          <div style={{ position: 'relative' }}>
            <button
              className="dg-toolbar-btn"
              aria-haspopup="true"
              aria-expanded={showColumnMenu}
              onClick={() => setShowColumnMenu(!showColumnMenu)}
            >
              <span>Columns</span>
              <span style={{ fontSize: '10px' }}>▼</span>
            </button>
            {showColumnMenu && (
              <div className="dg-menu dg-column-menu" ref={columnMenuRef} role="menu">
                {cols.map(col => (
                  <label key={String(col.field)} className="dg-menu-item" role="menuitemcheckbox" aria-checked={columnVisibility[String(col.field)] !== false}>
                    <input
                      type="checkbox"
                      checked={columnVisibility[String(col.field)] !== false}
                      onChange={() => toggleColumn(String(col.field))}
                    />
                    <span>{col.headerName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        <div id="custom-toolbar-buttons">{toolbar}</div>
      </div>

      <div
        className="dg-viewport"
        onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
        style={{ overflowY: 'auto', height: pagination ? 'calc(100% - 80px)' : 'calc(100% - 40px)' }}
      >
        {/* Header */}
        <div className="dg-header-row" style={{ gridTemplateColumns }} role="row">
          {sortedCols.map((col, idx) => {
            const isMenuOpen = activePinMenuCol === col.field;
            const style = {
              ...getStickyStyle(idx),
              zIndex: isMenuOpen ? 100 : (col.pinned ? 12 : undefined),
            };
            const isSystemCol = ['__checkbox', '__actions', '__expand'].includes(String(col.field));
            const isPinned = !!pinnedColumns[String(col.field)];
            const isSortable = col.sortable !== false && !isSystemCol;

            return (
              <div
                key={String(col.field)}
                className={`dg-header-cell ${col.pinned ? `pinned-${col.pinned}` : ''}`}
                style={style}
                role="columnheader"
                aria-sort={isSortable ? getAriaSort(String(col.field)) : undefined}
              >
                <div className="dg-header-main">
                  <div
                    className="dg-header-title"
                    onClick={() => isSortable && handleSortChange(String(col.field))}
                  >
                    {col.field === '__checkbox' ? (
                      <input type="checkbox" onChange={handleSelectAll} className="dg-checkbox" aria-label="Select all rows" />
                    ) : (
                      <>
                        <span>{col.headerName}</span>
                        {committedSortModel?.field === col.field && (
                          <span aria-hidden="true">{committedSortModel.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                        )}
                      </>
                    )}
                  </div>

                  {!isSystemCol && (
                    <div style={{ position: 'relative' }}>
                      <div
                        className={`dg-pin-icon ${isPinned ? 'pinned' : ''}`}
                        role="button"
                        aria-label={`Pin options for ${col.headerName}`}
                        onClick={(e) => { e.stopPropagation(); setActivePinMenuCol(activePinMenuCol === col.field ? null : String(col.field)); }}
                      >
                        <PinIcon />
                      </div>
                      {activePinMenuCol === col.field && (
                        <div className="dg-menu dg-pin-menu" ref={pinMenuRef} role="menu">
                          <div className={`dg-menu-item ${pinnedColumns[String(col.field)] === 'left' ? 'active' : ''}`} role="menuitem" onClick={() => handlePinColumn(String(col.field), 'left')}>Pin Left</div>
                          <div className={`dg-menu-item ${pinnedColumns[String(col.field)] === 'right' ? 'active' : ''}`} role="menuitem" onClick={() => handlePinColumn(String(col.field), 'right')}>Pin Right</div>
                          <div className={`dg-menu-item ${!pinnedColumns[String(col.field)] ? 'active' : ''}`} role="menuitem" onClick={() => handlePinColumn(String(col.field), false)}>No Pin</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {col.filterable !== false && !isSystemCol && (
                  <input
                    className="dg-column-filter"
                    placeholder="search..."
                    aria-label={`Filter by ${col.headerName}`}
                    value={filters[col.field as string] || ''}
                    onClick={e => e.stopPropagation()}
                    onChange={e => handleFilterChange(col.field as string, e.target.value)}
                  />
                )}
                {!isSystemCol && (
                  <div className="dg-resizer" aria-hidden="true" onMouseDown={e => handleMouseDown(e, String(col.field), col.width)} onClick={e => e.stopPropagation()} />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ height: anyRowExpanded ? undefined : totalContentHeight, position: 'relative' }}>
          {processedRows.length === 0 && !loading && (
            <div className="dg-no-rows" role="row">
              <span role="gridcell">No rows found</span>
            </div>
          )}
          <div className="dg-body" style={{ gridTemplateColumns, transform: `translateY(${offsetY}px)` }}>
            {visibleRows.map(item => {
              // Load-more / loading / error node
              if (item.type === 'load-more') {
                const hasRows = (loadedGroupRows[item.groupId]?.length ?? 0) > 0;
                return (
                  <div
                    key={`load-more-${item.groupId}`}
                    className="dg-load-more-row"
                    style={{ gridColumn: '1 / -1', height: rowHeight }}
                    role="row"
                  >
                    {item.state === 'loading' && (
                      <span className="dg-load-more-spinner" aria-label="Loading">Loading...</span>
                    )}
                    {item.state === 'error' && (
                      <button className="dg-load-more-btn dg-load-more-error" onClick={() => handleLoadMore(item.groupId)}>
                        Failed to load — Retry
                      </button>
                    )}
                    {item.state === 'idle' && hasRows && groupHasMore[item.groupId] && (
                      <button className="dg-load-more-btn" onClick={() => handleLoadMore(item.groupId)}>
                        Load more
                      </button>
                    )}
                  </div>
                );
              }

              // Group row
              if (item.type === 'group') {
                return (
                  <div
                    key={item.id}
                    className="dg-group-row"
                    role="row"
                    aria-expanded={!!expandedGroups[item.id]}
                    onClick={() => handleGroupToggle(item.id)}
                    style={{ gridColumn: '1 / -1', paddingLeft: `${item.depth * 20 + 12}px`, height: rowHeight }}
                  >
                    <span style={{ marginRight: 8 }} aria-hidden="true">{expandedGroups[item.id] ? '⇣' : '⇢'}</span>
                    <span><strong>{item.value}</strong> ({item.count})</span>
                  </div>
                );
              }

              // Data row
              const row = item.data;
              const rowId = resolveId(row);
              const isSel = selection.has(rowId);
              const isExpanded = expandedRows.has(rowId);
              const extraRowClass = getRowClassName ? getRowClassName(row) : '';
              return (
                <React.Fragment key={rowId}>
                  <div className={`dg-row ${isSel ? 'selected' : ''} ${extraRowClass}`} role="row" aria-selected={checkboxSelection ? isSel : undefined}>
                    {sortedCols.map((col, idx) => {
                      const style = { ...getStickyStyle(idx), height: rowHeight };
                      if (col.field === '__expand') {
                        return (
                          <div key={`${rowId}-exp`} className={`dg-cell ${col.pinned || ''}`} style={style} role="gridcell">
                            <button
                              className={`dg-expand-btn${isExpanded ? ' expanded' : ''}`}
                              onClick={() => handleRowExpand(rowId)}
                              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                              aria-expanded={isExpanded}
                            >
                              <ExpandIcon expanded={isExpanded} />
                            </button>
                          </div>
                        );
                      }
                      if (col.field === '__checkbox') {
                        return (
                          <div key={`${rowId}-cb`} className={`dg-cell ${col.pinned || ''}`} style={style} role="gridcell">
                            <input type="checkbox" checked={isSel} onChange={() => handleSelectRow(rowId)} className="dg-checkbox" aria-label="Select row" />
                          </div>
                        );
                      }
                      if (col.field === '__actions' && rowActions) {
                        const isOpen = activeMenuRowId === rowId;
                        if (isOpen) style.zIndex = 99;
                        return (
                          <div key={`${rowId}-act`} className={`dg-cell ${col.pinned || ''}`} style={{ ...style, overflow: 'visible' }} role="gridcell">
                            <ActionCell
                              row={row}
                              actions={rowActions(row)}
                              maxVisible={maxVisibleActions}
                              isOpen={isOpen}
                              onToggle={() => setActiveMenuRowId(isOpen ? null : rowId)}
                              onClose={() => setActiveMenuRowId(null)}
                            />
                          </div>
                        );
                      }
                      const cellValue = col.valueGetter ? col.valueGetter(row) : (row as any)[col.field];
                      const extraCellClass = col.cellClassName ? col.cellClassName(row) : '';
                      return (
                        <div key={`${rowId}-${String(col.field)}`} className={`dg-cell ${col.pinned ? `pinned-${col.pinned}` : ''} ${extraCellClass}`} style={style} role="gridcell">
                          {col.renderCell
                            ? col.renderCell({ row, value: cellValue, field: String(col.field) })
                            : cellValue
                          }
                        </div>
                      );
                    })}
                  </div>
                  {expandable && isExpanded && (
                    <div className="dg-expanded-row" style={{ gridColumn: '1 / -1' }} role="row">
                      {expandable.render(row)}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {pagination && (() => {
        const start = Math.min(footerTotal, (currentPage - 1) * effectivePageSize + 1);
        const end = paginationMode === 'server'
          ? Math.min(currentPage * effectivePageSize, rowCount ?? 0)
          : Math.min(currentPage * effectivePageSize, processedRows.length);

        return (
          <div className="dg-footer" role="navigation" aria-label="Pagination">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {checkboxSelection && selection.size > 0 && (
                <span className="dg-selection-count">{selection.size} selected</span>
              )}
              <span>Showing {start}–{end} of {footerTotal}</span>
              {pageSizeOptions && (
                <select
                  className="dg-page-size-select"
                  value={effectivePageSize}
                  onChange={e => handlePageSizeChange(Number(e.target.value))}
                  aria-label="Rows per page"
                >
                  {pageSizeOptions.map(size => (
                    <option key={size} value={size}>{size} / page</option>
                  ))}
                </select>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="dg-page-btn" aria-label="Previous page">Prev</button>
              <button disabled={currentPage >= totalPages} onClick={() => handlePageChange(currentPage + 1)} className="dg-page-btn" aria-label="Next page">Next</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
