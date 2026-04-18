import React, { useState, useCallback, useMemo } from 'react';
import EssealDataTable from '../src/EssealDataTable';
import type { TableState, GridColDef } from '../src/EssealDataTable';
import '../src/EssealDataTable.css';

// ─── Dataset ────────────────────────────────────────────────────────────────

interface Employee {
  id: number;
  name: string;
  role: string;
  department: {
    name: string
  };
  location: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  salary: number;
  age: number;
  joined: string;
  performance: number; // 0–100
}

const ALL_ROWS: Employee[] = [
  { id: 1, name: 'Alice Johnson', role: 'Engineer', department: { name: 'Engineering' }, location: 'New York', status: 'Active', salary: 95000, age: 29, joined: '2021-03-15', performance: 92 },
  { id: 2, name: 'Bob Smith', role: 'Designer', department: { name: 'Design' }, location: 'London', status: 'Active', salary: 82000, age: 34, joined: '2019-07-01', performance: 78 },
  { id: 3, name: 'Carol White', role: 'Manager', department: { name: 'Engineering' }, location: 'New York', status: 'Inactive', salary: 115000, age: 41, joined: '2017-01-10', performance: 65 },
  { id: 4, name: 'David Lee', role: 'Engineer', department: { name: 'Engineering' }, location: 'Remote', status: 'Active', salary: 88000, age: 26, joined: '2022-06-20', performance: 88 },
  { id: 5, name: 'Eva Martinez', role: 'Analyst', department: { name: 'Finance' }, location: 'Chicago', status: 'Active', salary: 79000, age: 31, joined: '2020-11-05', performance: 81 },
  { id: 6, name: 'Frank Brown', role: 'Designer', department: { name: 'Design' }, location: 'London', status: 'On Leave', salary: 77000, age: 38, joined: '2018-04-22', performance: 70 },
  { id: 7, name: 'Grace Kim', role: 'Engineer', department: { name: 'Engineering' }, location: 'Remote', status: 'Active', salary: 91000, age: 27, joined: '2022-01-17', performance: 95 },
  { id: 8, name: 'Henry Wilson', role: 'Manager', department: { name: 'Finance' }, location: 'Chicago', status: 'Active', salary: 122000, age: 45, joined: '2015-08-30', performance: 74 },
  { id: 9, name: 'Iris Chen', role: 'Engineer', department: { name: 'Engineering' }, location: 'New York', status: 'Active', salary: 97000, age: 30, joined: '2021-09-12', performance: 90 },
  { id: 10, name: 'Jake Turner', role: 'Analyst', department: { name: 'Finance' }, location: 'Remote', status: 'Inactive', salary: 73000, age: 28, joined: '2023-02-01', performance: 60 },
  { id: 11, name: 'Karen Patel', role: 'HR Specialist', department: { name: 'HR' }, location: 'Chicago', status: 'Active', salary: 68000, age: 33, joined: '2019-05-14', performance: 83 },
  { id: 12, name: 'Leo Nguyen', role: 'Engineer', department: { name: 'Engineering' }, location: 'London', status: 'Active', salary: 93000, age: 25, joined: '2023-07-03', performance: 87 },
  { id: 13, name: 'Mia Scott', role: 'Designer', department: { name: 'Design' }, location: 'New York', status: 'On Leave', salary: 80000, age: 36, joined: '2018-10-19', performance: 76 },
  { id: 14, name: 'Nathan Brooks', role: 'Manager', department: { name: 'HR' }, location: 'Remote', status: 'Active', salary: 108000, age: 43, joined: '2016-03-07', performance: 79 },
  { id: 15, name: 'Olivia Clark', role: 'Analyst', department: { name: 'Finance' }, location: 'London', status: 'Active', salary: 76000, age: 29, joined: '2022-08-25', performance: 85 },
];

// ─── Icons ───────────────────────────────────────────────────────────────────

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const ViewIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ExportIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Active': { bg: '#dcfce7', color: '#16a34a' },
  'Inactive': { bg: '#fee2e2', color: '#dc2626' },
  'On Leave': { bg: '#fef9c3', color: '#ca8a04' },
};

function PerformanceBar({ value }: { value: number }) {
  const color = value >= 85 ? '#16a34a' : value >= 70 ? '#ca8a04' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
      <div style={{ flex: 1, background: '#e2e8f0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11, color: '#64748b', minWidth: 28 }}>{value}%</span>
    </div>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: GridColDef<Employee>[] = [
  { field: 'id', headerName: 'ID', width: 60, sortable: true, filterable: false },
  { field: 'name', headerName: 'Name', width: 180, sortable: true, pinned: 'left' },
  { field: 'role', headerName: 'Role', width: 140, sortable: true },
  { field: 'department', headerName: 'Department', width: 140, sortable: true, valueGetter: (row) => row.department.name },
  { field: 'location', headerName: 'Location', width: 120, sortable: true },
  { field: 'age', headerName: 'Age', width: 70, sortable: true, filterable: false },
  { field: 'joined', headerName: 'Joined', width: 110, sortable: true },
  {
    field: 'salary',
    headerName: 'Salary',
    width: 110,
    sortable: true,
    filterable: false,
    renderCell: ({ value }) => (
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        ${(value as number).toLocaleString()}
      </span>
    ),
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 110,
    sortable: true,
    cellClassName: (row) => row.status === 'On Leave' ? 'cell-on-leave' : '',
    renderCell: ({ value }) => {
      const s = STATUS_COLORS[value as string] ?? { bg: '#f1f5f9', color: '#64748b' };
      return (
        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, background: s.bg, color: s.color, fontWeight: 500 }}>
          {value as string}
        </span>
      );
    },
  },
  {
    field: 'performance',
    headerName: 'Performance',
    width: 150,
    sortable: true,
    filterable: false,
    renderCell: ({ value }) => <PerformanceBar value={value as number} />,
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  page: { fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' as const, height: '100vh', background: '#f8fafc' },
  header: { padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title: { margin: 0, fontSize: 18, fontWeight: 600, color: '#0f172a' },
  badge: { fontSize: 11, background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: 12, fontWeight: 500 },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: { width: 260, borderRight: '1px solid #e2e8f0', background: '#fff', overflowY: 'auto' as const, padding: '16px 0' },
  section: { padding: '0 16px 16px' },
  sectionHd: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 10, marginTop: 16 },
  main: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', padding: 24, gap: 16 },
  tableWrap: { flex: 1, minHeight: 0 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 13, color: '#374151' },
  toggle: { position: 'relative' as const, display: 'inline-block', width: 36, height: 20 },
  input: { width: 60, border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 6px', fontSize: 12, color: '#374151' },
  select: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px 6px', fontSize: 12, color: '#374151', marginTop: 4 },
  infoBox: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#374151' },
  infoLabel: { fontWeight: 600, color: '#64748b', fontSize: 11, marginBottom: 4 },
  pill: { display: 'inline-block', background: '#f1f5f9', borderRadius: 4, padding: '1px 6px', fontSize: 11, color: '#374151', margin: '1px' },
  btn: { padding: '5px 10px', fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 5 },
  resetBtn: { width: '100%', padding: '6px', fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 4, background: '#f8fafc', cursor: 'pointer', color: '#374151', marginTop: 8 },
  divider: { border: 'none', borderTop: '1px solid #f1f5f9', margin: '8px 0' },
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={S.toggle}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{
        position: 'absolute', inset: 0, borderRadius: 20, cursor: 'pointer',
        background: checked ? '#0ea5e9' : '#cbd5e1', transition: 'background 0.2s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2, width: 16, height: 16,
          borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,.2)',
        }} />
      </span>
    </label>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  // Feature toggles
  const [checkboxSelection, setCheckboxSelection] = useState(true);
  const [pagination, setPagination] = useState(true);
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [disableColumnMenu, setDisableColumnMenu] = useState(false);
  const [maxVisibleActions, setMaxVisibleActions] = useState(1);
  const [rowHeight, setRowHeight] = useState(40);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [disableEdit, setDisableEdit] = useState(false);
  const [showCustomToolbar, setShowCustomToolbar] = useState(true);

  // Observable state
  const [tableState, setTableState] = useState<TableState | null>(null);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 8));
  }, []);

  const handleStateChange = useCallback((s: TableState) => {
    setTableState(s);
  }, []);

  const handleSelectionChange = useCallback((ids: (string | number)[]) => {
    setSelectedIds(ids);
    addLog(`Selection changed: [${ids.join(', ')}]`);
  }, [addLog]);

  const rowActions = useCallback((row: Employee) => [
    {
      label: 'View',
      icon: <ViewIcon />,
      tooltipText: 'View details',
      onClick: (r: Employee) => addLog(`View: ${r.name}`),
    },
    {
      label: 'Edit',
      icon: <EditIcon />,
      tooltipText: disableEdit ? 'Editing is disabled' : 'Edit row',
      disabled: disableEdit,
      onClick: (r: Employee) => addLog(`Edit: ${r.name}`),
    },
    {
      label: 'Delete',
      icon: <DeleteIcon />,
      tooltipText: 'Delete row',
      onClick: (r: Employee) => addLog(`Delete: ${r.name} (id=${r.id})`),
    },
  ], [disableEdit, addLog]);

  const customToolbar = useMemo(() => showCustomToolbar ? (
    <div style={{ display: 'flex', gap: 6 }}>
      <button style={S.btn} onClick={() => addLog('Export clicked')}><ExportIcon /> Export</button>
      <button style={S.btn} onClick={() => addLog(`Total rows: ${ALL_ROWS.length}`)}>Row count</button>
    </div>
  ) : undefined, [showCustomToolbar, addLog]);

  const toggleGroupBy = useCallback((field: string) => {
    setGroupBy(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  }, []);

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <h1 style={S.title}>EssealDataTable — Playground</h1>
        <span style={S.badge}>Full feature demo</span>
      </div>

      <div style={S.body}>
        {/* Sidebar controls */}
        <div style={S.sidebar}>

          <div style={S.section}>
            <div style={S.sectionHd}>Data</div>

            <div style={S.row}>
              <span style={S.label}>Loading</span>
              <Toggle checked={loading} onChange={setLoading} />
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ ...S.label, marginBottom: 6 }}>
                Group by
                {groupBy.length > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: '#0ea5e9' }}>
                    ({groupBy.join(' → ')})
                  </span>
                )}
              </div>
              {(['department', 'role', 'location', 'status'] as const).map((field) => (
                <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                  <input
                    type="checkbox"
                    checked={groupBy.includes(field)}
                    onChange={() => toggleGroupBy(field)}
                  />
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                  {groupBy.includes(field) && (
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8' }}>
                      level {groupBy.indexOf(field) + 1}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <hr style={S.divider} />

          <div style={S.section}>
            <div style={S.sectionHd}>Layout</div>

            <div style={S.row}>
              <span style={S.label}>Row height</span>
              <input
                type="number" min={28} max={80} style={S.input}
                value={rowHeight} onChange={e => setRowHeight(Number(e.target.value))}
              />
            </div>
          </div>

          <hr style={S.divider} />

          <div style={S.section}>
            <div style={S.sectionHd}>Selection</div>

            <div style={S.row}>
              <span style={S.label}>Checkbox selection</span>
              <Toggle checked={checkboxSelection} onChange={setCheckboxSelection} />
            </div>
          </div>

          <hr style={S.divider} />

          <div style={S.section}>
            <div style={S.sectionHd}>Pagination</div>

            <div style={S.row}>
              <span style={S.label}>Enable pagination</span>
              <Toggle checked={pagination} onChange={setPagination} />
            </div>

            <div style={S.row}>
              <span style={S.label}>Page size</span>
              <input
                type="number" min={1} max={15} style={S.input} disabled={!pagination}
                value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
              />
            </div>
          </div>

          <hr style={S.divider} />

          <div style={S.section}>
            <div style={S.sectionHd}>Toolbar</div>

            <div style={S.row}>
              <span style={S.label}>Disable column menu</span>
              <Toggle checked={disableColumnMenu} onChange={setDisableColumnMenu} />
            </div>

            <div style={S.row}>
              <span style={S.label}>Custom toolbar</span>
              <Toggle checked={showCustomToolbar} onChange={setShowCustomToolbar} />
            </div>
          </div>

          <hr style={S.divider} />

          <div style={S.section}>
            <div style={S.sectionHd}>Row Actions</div>

            <div style={S.row}>
              <span style={S.label}>Max visible</span>
              <input
                type="number" min={1} max={3} style={S.input}
                value={maxVisibleActions} onChange={e => setMaxVisibleActions(Number(e.target.value))}
              />
            </div>

            <div style={S.row}>
              <span style={S.label}>Disable "Edit"</span>
              <Toggle checked={disableEdit} onChange={setDisableEdit} />
            </div>
          </div>

          <hr style={S.divider} />

          <div style={S.section}>
            <button style={S.resetBtn} onClick={() => {
              setCheckboxSelection(true); setPagination(true); setPageSize(5);
              setLoading(false); setDisableColumnMenu(false); setMaxVisibleActions(1);
              setRowHeight(40); setGroupBy([]); setDisableEdit(false); setShowCustomToolbar(true);
            }}>
              Reset all to defaults
            </button>
          </div>

        </div>

        {/* Main area */}
        <div style={S.main}>
          <div style={S.tableWrap}>
            <EssealDataTable<Employee>
              rows={ALL_ROWS}
              columns={COLUMNS}
              groupBy={groupBy as (keyof Employee)[]}
              rowHeight={rowHeight}
              loading={loading}
              pagination={pagination}
              pageSize={pageSize}
              checkboxSelection={checkboxSelection}
              disableColumnMenu={disableColumnMenu}
              maxVisibleActions={maxVisibleActions}
              rowActions={rowActions}
              toolbar={customToolbar}
              onStateChange={handleStateChange}
              onSelectionChange={handleSelectionChange}
              getRowClassName={(row) => row.status === 'Inactive' ? 'row-inactive' : ''}
            />
          </div>

          {/* Info panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

            {/* Selection */}
            <div style={S.infoBox}>
              <div style={S.infoLabel}>Selected rows ({selectedIds.length})</div>
              {selectedIds.length === 0
                ? <span style={{ color: '#94a3b8', fontSize: 12 }}>None</span>
                : selectedIds.map(id => <span key={id} style={S.pill}>id={id}</span>)
              }
            </div>

            {/* Current state */}
            <div style={S.infoBox}>
              <div style={S.infoLabel}>Table state (onStateChange)</div>
              {tableState ? (
                <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.8 }}>
                  <div><b>Page:</b> {tableState.page}</div>
                  <div><b>Sort:</b> {tableState.sortModel ? `${tableState.sortModel.field} ${tableState.sortModel.direction}` : 'none'}</div>
                  <div><b>Filters:</b> {Object.entries(tableState.filterModel).filter(([, v]) => v).map(([k, v]) => `${k}="${v}"`).join(', ') || 'none'}</div>
                  <div><b>Pinned:</b> {Object.entries(tableState.pinnedColumns).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(', ') || 'none'}</div>
                  <div><b>Hidden:</b> {Object.entries(tableState.columnVisibility).filter(([, v]) => !v).map(([k]) => k).join(', ') || 'none'}</div>
                </div>
              ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>Interact with the table…</span>}
            </div>

            {/* Action log */}
            <div style={S.infoBox}>
              <div style={S.infoLabel}>Action log</div>
              {log.length === 0
                ? <span style={{ color: '#94a3b8', fontSize: 12 }}>No actions yet…</span>
                : log.map((entry, i) => (
                  <div key={i} style={{ fontSize: 11, color: i === 0 ? '#0f172a' : '#94a3b8', marginBottom: 2 }}>{entry}</div>
                ))
              }
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
