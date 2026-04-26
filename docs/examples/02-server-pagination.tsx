/**
 * Example 02 — Server-side pagination with offset-based fetching.
 *
 * Demonstrates paginationMode="server" with a simulated API.
 * The table fires onServerRequest on mount, page change, sort change,
 * and (debounced) filter change. The developer owns the rows state.
 */

import React, { useState } from 'react';
import { EssealDataTable } from 'esseal-data-table';
import type { GridColDef, ServerRequestParams } from 'esseal-data-table';
import 'esseal-data-table/style.css';

interface Order {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
}

// ── Simulated database of 200 orders ─────────────────────────────────────────

const STATUSES: Order['status'][] = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
const ALL_ORDERS: Order[] = Array.from({ length: 200 }, (_, i) => ({
  id: `ORD-${String(i + 1).padStart(5, '0')}`,
  customer: ['Alice', 'Bob', 'Carol', 'David', 'Eva'][i % 5] + ` (${Math.floor(i / 5) + 1})`,
  product:  ['Keyboard', 'Monitor', 'Mouse', 'Headset', 'Webcam', 'Desk', 'Chair'][i % 7],
  amount:   Math.round((20 + (i * 37) % 500) * 100) / 100,
  status:   STATUSES[i % 4],
  createdAt: new Date(2024, 0, 1 + (i % 365)).toISOString().slice(0, 10),
}));

// ── Simulated server API ──────────────────────────────────────────────────────

async function fetchOrders(params: ServerRequestParams): Promise<{ rows: Order[]; total: number }> {
  // Simulate network latency
  await new Promise(res => setTimeout(res, 300));

  let data = [...ALL_ORDERS];

  // Apply filters
  Object.entries(params.filterModel).forEach(([field, val]) => {
    if (!val.trim()) return;
    data = data.filter(row =>
      String((row as any)[field] ?? '').toLowerCase().includes(val.toLowerCase())
    );
  });

  // Apply sort
  if (params.sortModel) {
    const { field, direction } = params.sortModel;
    data.sort((a, b) => {
      const va = (a as any)[field];
      const vb = (b as any)[field];
      return (va < vb ? -1 : va > vb ? 1 : 0) * (direction === 'asc' ? 1 : -1);
    });
  }

  const total = data.length;
  const offset = (params.page - 1) * params.pageSize;
  return { rows: data.slice(offset, offset + params.pageSize), total };
}

// ── Column definitions ────────────────────────────────────────────────────────

const COLUMNS: GridColDef<Order>[] = [
  { field: 'id',        headerName: 'Order ID',  width: 120, sortable: false },
  { field: 'customer',  headerName: 'Customer',  width: 160 },
  { field: 'product',   headerName: 'Product',   width: 130 },
  {
    field: 'amount',
    headerName: 'Amount',
    width: 100,
    filterable: false,
    renderCell: ({ value }) => (
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>${(value as number).toFixed(2)}</span>
    ),
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: ({ value }) => {
      const colors: Record<string, { bg: string; color: string }> = {
        Pending:   { bg: '#fef9c3', color: '#854d0e' },
        Shipped:   { bg: '#dbeafe', color: '#1d4ed8' },
        Delivered: { bg: '#dcfce7', color: '#166534' },
        Cancelled: { bg: '#fee2e2', color: '#991b1b' },
      };
      const s = colors[value as string] ?? { bg: '#f1f5f9', color: '#374151' };
      return (
        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500, ...s }}>
          {String(value)}
        </span>
      );
    },
  },
  { field: 'createdAt', headerName: 'Created',  width: 110, filterable: false },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function ServerPaginationExample() {
  const [rows, setRows]     = useState<Order[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);

  const handleServerRequest = async (params: ServerRequestParams) => {
    setLoading(true);
    try {
      const data = await fetchOrders(params);
      setRows(data.rows);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, height: '100vh', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h2 style={{ margin: 0 }}>Orders — Server Pagination</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
          {total} total orders · page size selector in footer
        </p>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <EssealDataTable<Order>
          rows={rows}
          columns={COLUMNS}
          loading={loading}
          pagination
          pageSize={[10, 25, 50]}
          paginationMode="server"
          rowCount={total}
          onServerRequest={handleServerRequest}
          filterDebounceMs={400}
        />
      </div>
    </div>
  );
}
