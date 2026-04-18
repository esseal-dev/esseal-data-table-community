/* eslint-disable */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import './EssealDataTable.css';
import type { DataGridProps, GridColDef, PinDirection, SortModel, FilterModel } from './types';
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
} from './types';

const ACTION_BTN_WIDTH = 35;
const ACTION_COL_BASE_WIDTH = 60;

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"></line>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
  </svg>
);

export default function EssealDataTable<T>({
  rows,
  columns: initialColumns,
  getRowId,
  groupBy = [],
  rowHeight = 40,
  height = 600,
  loading = false,
  initialState,
  onStateChange,
  rowActions,
  maxVisibleActions = 1,
  checkboxSelection = false,
  pagination = false,
  pageSize = 10,
  disableColumnMenu = false,
  toolbar = undefined,
  onSelectionChange,
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

  const [cols, setCols] = useState<GridColDef<T>[]>(initialColumns);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => setContainerWidth(entries[0].contentRect.width));
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
  const [scrollTop, setScrollTop] = useState(0);
  const [activeMenuRowId, setActiveMenuRowId] = useState<string | number | null>(null);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const [activePinMenuCol, setActivePinMenuCol] = useState<string | null>(null);
  const pinMenuRef = useRef<HTMLDivElement>(null);

  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onStateChangeRef.current = onStateChange; });

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
      columnVisibility,
      pinnedColumns,
    });
  }, [currentPage, sortModel, filters, expandedGroups, columnVisibility, pinnedColumns]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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

  const { sortedCols, gridTemplateColumns } = useMemo(() => {
    const visibleCols = cols.filter(c => columnVisibility[String(c.field)] !== false);
    const pinnedLeft = visibleCols.filter(c => pinnedColumns[String(c.field)] === 'left');
    const pinnedRight = visibleCols.filter(c => pinnedColumns[String(c.field)] === 'right');
    const unpinned = visibleCols.filter(c => !pinnedColumns[String(c.field)] && c.field !== '__checkbox' && c.field !== '__actions');

    if (checkboxSelection) {
      pinnedLeft.unshift({ field: '__checkbox', headerName: '', width: 40, pinned: 'left', sortable: false, filterable: false });
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

    // Expand columns to fill available container width, preserving defined widths as minimums
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

  const processedRows = useMemo(() => {
    let res = filterRows(rows, filters, valueGetters);
    res = sortRows(res, sortModel, valueGetters);
    const tree = groupRows(res, groupBy as (keyof T)[], valueGetters, resolveId);
    return flattenTree(tree, expandedGroups);
  }, [rows, filters, sortModel, groupBy, expandedGroups, valueGetters]);

  const rowsToRender = useMemo(() => {
    if (!pagination) return processedRows;
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, pagination, currentPage, pageSize]);

  const totalPages = pagination ? Math.ceil(processedRows.length / pageSize) : 1;
  const totalContentHeight = rowsToRender.length * rowHeight;

  const buffer = 4;
  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.min(rowsToRender.length, Math.floor((scrollTop + height) / rowHeight) + buffer);
  const visibleRows = rowsToRender.slice(startIndex, endIndex);
  const offsetY = startIndex * rowHeight;

  const toggleGroup = (id: string) => setExpandedGroups(p => ({ ...p, [id]: !p[id] }));

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
    if (sortModel?.field !== field) return 'none';
    return sortModel.direction === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className="dg-container" style={{ height }} role="grid" aria-rowcount={processedRows.length} aria-colcount={sortedCols.length} ref={containerRef}>
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
            const isSystemCol = ['__checkbox', '__actions'].includes(String(col.field));
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
                    onClick={() =>
                      isSortable && setSortModel(p =>
                        p?.field === col.field && p.direction === 'asc'
                          ? { field: String(col.field), direction: 'desc' }
                          : { field: String(col.field), direction: 'asc' }
                      )
                    }
                  >
                    {col.field === '__checkbox' ? (
                      <input type="checkbox" onChange={handleSelectAll} className="dg-checkbox" aria-label="Select all rows" />
                    ) : (
                      <>
                        <span>{col.headerName}</span>
                        {sortModel?.field === col.field && (
                          <span aria-hidden="true">{sortModel.direction === 'asc' ? ' ↑' : ' ↓'}</span>
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
                    onChange={e => setFilters(p => ({ ...p, [col.field as string]: e.target.value }))}
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
        <div style={{ height: totalContentHeight, position: 'relative' }}>
          {processedRows.length === 0 && !loading && (
            <div className="dg-no-rows" role="row">
              <span role="gridcell">No rows found</span>
            </div>
          )}
          <div className="dg-body" style={{ gridTemplateColumns, transform: `translateY(${offsetY}px)` }}>
            {visibleRows.map(item => {
              if (item.type === 'group') {
                return (
                  <div
                    key={item.id}
                    className="dg-group-row"
                    role="row"
                    aria-expanded={!!expandedGroups[item.id]}
                    onClick={() => toggleGroup(item.id)}
                    style={{ gridColumn: '1 / -1', paddingLeft: `${item.depth * 20 + 12}px`, height: rowHeight }}
                  >
                    <span style={{ marginRight: 8 }} aria-hidden="true">{expandedGroups[item.id] ? '▼' : '▶'}</span>
                    <span>{String(item.field)}: <strong>{item.value}</strong> ({item.count})</span>
                  </div>
                );
              }

              const row = item.data;
              const rowId = resolveId(row);
              const isSel = selection.has(rowId);
              return (
                <div key={rowId} className={`dg-row ${isSel ? 'selected' : ''}`} role="row" aria-selected={checkboxSelection ? isSel : undefined}>
                  {sortedCols.map((col, idx) => {
                    const style = { ...getStickyStyle(idx), height: rowHeight };
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
                    return (
                      <div key={`${rowId}-${String(col.field)}`} className={`dg-cell ${col.pinned ? `pinned-${col.pinned}` : ''}`} style={style} role="gridcell">
                        {col.renderCell
                          ? col.renderCell({ row, value: cellValue, field: String(col.field) })
                          : cellValue
                        }
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {pagination && (
        <div className="dg-footer" role="navigation" aria-label="Pagination">
          <div>
            Showing {Math.min(processedRows.length, (currentPage - 1) * pageSize + 1)}–{Math.min(currentPage * pageSize, processedRows.length)} of {processedRows.length}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="dg-page-btn" aria-label="Previous page">Prev</button>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="dg-page-btn" aria-label="Next page">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
