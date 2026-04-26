/**
 * Example 05 — Production-style dashboard table.
 *
 * Combines: server-side pagination, custom toolbar with export,
 * row actions with conditional disabled state, nested valueGetter,
 * custom cell rendering, conditional row and cell styling,
 * checkbox selection with bulk-action bar, and state persistence.
 *
 * This resembles how you'd wire the component in a real application.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { EssealDataTable } from 'esseal-data-table';
import type { GridColDef, GridAction, ServerRequestParams, TableState } from 'esseal-data-table';
import 'esseal-data-table/style.css';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Ticket {
  id: string;
  title: string;
  assignee: { name: string; avatar: string };
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  team: string;
  createdAt: string;
  slaBreached: boolean;
}

// ── Simulated data ────────────────────────────────────────────────────────────

const PRIORITIES: Ticket['priority'][] = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: Ticket['status'][] = ['Open', 'In Progress', 'Resolved', 'Closed'];
const TEAMS = ['Frontend', 'Backend', 'Infrastructure', 'Security', 'Data'];
const ASSIGNEES = ['Alice J.', 'Bob S.', 'Carol W.', 'David L.', 'Eva M.'];

const ALL_TICKETS: Ticket[] = Array.from({ length: 150 }, (_, i) => ({
  id: `TKT-${String(i + 1).padStart(4, '0')}`,
  title: `${['Fix', 'Update', 'Investigate', 'Deploy', 'Review'][i % 5]} ${['login flow', 'API endpoint', 'performance issue', 'database query', 'UI component'][i % 5]} #${i + 1}`,
  assignee: { name: ASSIGNEES[i % 5], avatar: ASSIGNEES[i % 5][0] },
  priority: PRIORITIES[i % 4],
  status:   STATUSES[i % 4],
  team:     TEAMS[i % 5],
  createdAt: new Date(2024, 0, 1 + (i % 365)).toISOString().slice(0, 10),
  slaBreached: i % 7 === 0,
}));

async function fetchTickets(params: ServerRequestParams) {
  await new Promise(res => setTimeout(res, 250));
  let data = [...ALL_TICKETS];

  Object.entries(params.filterModel).forEach(([field, val]) => {
    if (!val.trim()) return;
    data = data.filter(row => {
      const raw = field === 'assignee' ? row.assignee.name : (row as any)[field];
      return String(raw ?? '').toLowerCase().includes(val.toLowerCase());
    });
  });

  if (params.sortModel) {
    const { field, direction } = params.sortModel;
    data.sort((a, b) => {
      const va = field === 'assignee' ? a.assignee.name : (a as any)[field];
      const vb = field === 'assignee' ? b.assignee.name : (b as any)[field];
      return (va < vb ? -1 : va > vb ? 1 : 0) * (direction === 'asc' ? 1 : -1);
    });
  }

  return {
    rows: data.slice((params.page - 1) * params.pageSize, params.page * params.pageSize),
    total: data.length,
  };
}

// ── Styling helpers ───────────────────────────────────────────────────────────

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  Critical: { bg: '#fee2e2', color: '#991b1b' },
  High:     { bg: '#fef3c7', color: '#92400e' },
  Medium:   { bg: '#dbeafe', color: '#1e40af' },
  Low:      { bg: '#f0fdf4', color: '#166534' },
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'Open':        { bg: '#fef9c3', color: '#854d0e' },
  'In Progress': { bg: '#dbeafe', color: '#1d4ed8' },
  'Resolved':    { bg: '#dcfce7', color: '#166534' },
  'Closed':      { bg: '#f1f5f9', color: '#475569' },
};

// ── Column definitions ────────────────────────────────────────────────────────

const COLUMNS: GridColDef<Ticket>[] = [
  { field: 'id',    headerName: 'ID',    width: 90, filterable: false, sortable: false },
  { field: 'title', headerName: 'Title', width: 260 },
  {
    field: 'assignee',
    headerName: 'Assignee',
    width: 130,
    valueGetter: (row) => row.assignee.name,
    renderCell: ({ row }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%', background: '#dbeafe',
          color: '#1e40af', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {row.assignee.avatar}
        </div>
        <span>{row.assignee.name}</span>
      </div>
    ),
  },
  {
    field: 'priority',
    headerName: 'Priority',
    width: 100,
    renderCell: ({ value }) => {
      const s = PRIORITY_STYLE[value as string] ?? { bg: '#f1f5f9', color: '#374151' };
      return <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, ...s }}>{String(value)}</span>;
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: ({ value }) => {
      const s = STATUS_STYLE[value as string] ?? { bg: '#f1f5f9', color: '#374151' };
      return <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500, ...s }}>{String(value)}</span>;
    },
  },
  { field: 'team',      headerName: 'Team',    width: 120 },
  { field: 'createdAt', headerName: 'Created', width: 100, filterable: false },
];

// ── Main component ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'support-tickets-state';

export default function ProductionDashboard() {
  const [rows, setRows]       = useState<Ticket[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  const savedState = useMemo<Partial<TableState> | undefined>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : undefined;
    } catch { return undefined; }
  }, []);

  const handleServerRequest = useCallback(async (params: ServerRequestParams) => {
    setLoading(true);
    try {
      const data = await fetchTickets(params);
      setRows(data.rows);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStateChange = useCallback((state: TableState) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, []);

  const rowActions = useCallback((row: Ticket): GridAction<Ticket>[] => [
    {
      label: 'View',
      onClick: (r) => alert(`Viewing ticket ${r.id}`),
    },
    {
      label: 'Assign to me',
      onClick: (r) => alert(`Assigned ${r.id} to you`),
    },
    {
      label: row.status === 'Resolved' ? 'Reopen' : 'Resolve',
      onClick: (r) => alert(`${r.status === 'Resolved' ? 'Reopened' : 'Resolved'} ticket ${r.id}`),
    },
    {
      label: 'Delete',
      disabled: row.status !== 'Closed',
      tooltipText: row.status !== 'Closed' ? 'Only closed tickets can be deleted' : 'Delete ticket',
      onClick: (r) => alert(`Deleted ${r.id}`),
    },
  ], []);

  const toolbar = useMemo(() => (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', background: '#fff' }}
        onClick={() => alert('Exporting CSV...')}
      >
        Export CSV
      </button>
      {selectedIds.length > 0 && (
        <button
          style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #dc2626', borderRadius: 4, cursor: 'pointer', background: '#fee2e2', color: '#991b1b' }}
          onClick={() => alert(`Bulk close ${selectedIds.length} ticket(s)`)}
        >
          Close {selectedIds.length} selected
        </button>
      )}
    </div>
  ), [selectedIds]);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
        <h2 style={{ margin: 0 }}>Support Tickets</h2>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>{total} tickets total</p>
      </div>

      <div style={{ flex: 1, minHeight: 0, padding: 24 }}>
        <EssealDataTable<Ticket>
          rows={rows}
          columns={COLUMNS}
          getRowId={(row) => row.id}
          loading={loading}
          pagination
          pageSize={[15, 25, 50]}
          paginationMode="server"
          rowCount={total}
          onServerRequest={handleServerRequest}
          initialState={savedState}
          onStateChange={handleStateChange}
          checkboxSelection
          onSelectionChange={setSelectedIds}
          maxVisibleActions={1}
          rowActions={rowActions}
          toolbar={toolbar}
          getRowClassName={(row) => row.slaBreached ? 'row-sla-breached' : ''}
        />
      </div>

      <style>{`
        .row-sla-breached .dg-cell {
          background: #fff7ed;
          border-left: 3px solid #ea580c;
        }
      `}</style>
    </div>
  );
}
