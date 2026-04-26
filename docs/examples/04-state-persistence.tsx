/**
 * Example 04 — State persistence with localStorage.
 *
 * The full table state (sort, filters, page, pinning, visibility, group
 * expand state) is saved to localStorage on every change and restored
 * on the next page load.
 *
 * TableState is a plain serialisable object — store it anywhere:
 * localStorage, sessionStorage, a URL query string, or a remote API.
 */

import React, { useCallback, useMemo } from 'react';
import { EssealDataTable } from 'esseal-data-table';
import type { GridColDef, TableState } from 'esseal-data-table';
import 'esseal-data-table/style.css';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'Credit' | 'Debit';
}

const ROWS: Transaction[] = [
  { id: 'T001', date: '2024-01-03', description: 'Salary',         category: 'Income',    amount: 4500,  type: 'Credit' },
  { id: 'T002', date: '2024-01-05', description: 'Rent',           category: 'Housing',   amount: 1200,  type: 'Debit'  },
  { id: 'T003', date: '2024-01-07', description: 'Groceries',      category: 'Food',      amount: 134.5, type: 'Debit'  },
  { id: 'T004', date: '2024-01-10', description: 'Netflix',        category: 'Utilities', amount: 15.99, type: 'Debit'  },
  { id: 'T005', date: '2024-01-12', description: 'Freelance',      category: 'Income',    amount: 800,   type: 'Credit' },
  { id: 'T006', date: '2024-01-15', description: 'Electricity',    category: 'Utilities', amount: 89,    type: 'Debit'  },
  { id: 'T007', date: '2024-01-18', description: 'Dining out',     category: 'Food',      amount: 47.3,  type: 'Debit'  },
  { id: 'T008', date: '2024-01-20', description: 'Gym membership', category: 'Health',    amount: 40,    type: 'Debit'  },
  { id: 'T009', date: '2024-01-22', description: 'Amazon',         category: 'Shopping',  amount: 63.99, type: 'Debit'  },
  { id: 'T010', date: '2024-01-25', description: 'Dividend',       category: 'Income',    amount: 120,   type: 'Credit' },
  { id: 'T011', date: '2024-01-28', description: 'Internet',       category: 'Utilities', amount: 55,    type: 'Debit'  },
  { id: 'T012', date: '2024-01-30', description: 'Coffee',         category: 'Food',      amount: 22.5,  type: 'Debit'  },
];

const COLUMNS: GridColDef<Transaction>[] = [
  { field: 'id',          headerName: 'ID',          width: 80,  sortable: false },
  { field: 'date',        headerName: 'Date',        width: 110 },
  { field: 'description', headerName: 'Description', width: 180 },
  { field: 'category',    headerName: 'Category',    width: 120 },
  {
    field: 'amount',
    headerName: 'Amount',
    width: 100,
    filterable: false,
    renderCell: ({ value, row }) => (
      <span style={{
        fontVariantNumeric: 'tabular-nums',
        color: row.type === 'Credit' ? '#16a34a' : '#dc2626',
        fontWeight: 500,
      }}>
        {row.type === 'Credit' ? '+' : '−'}${(value as number).toFixed(2)}
      </span>
    ),
  },
  {
    field: 'type',
    headerName: 'Type',
    width: 90,
    renderCell: ({ value }) => (
      <span style={{
        padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500,
        background: value === 'Credit' ? '#dcfce7' : '#fee2e2',
        color:      value === 'Credit' ? '#166534' : '#991b1b',
      }}>
        {String(value)}
      </span>
    ),
  },
];

const STORAGE_KEY = 'transactions-table-state';

export default function StatePersistenceExample() {
  // Restore saved state on mount — useMemo ensures this only runs once.
  const savedState = useMemo<Partial<TableState> | undefined>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  }, []);

  // Persist state on every change — useCallback keeps the reference stable.
  const handleStateChange = useCallback((state: TableState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage may be unavailable in private browsing or storage-full conditions
    }
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, height: '100vh', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0 }}>Transaction History</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Sort, filter, and pin columns — your settings are saved automatically.
          </p>
        </div>
        <button
          style={{ padding: '6px 12px', fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
          }}
        >
          Reset saved state
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <EssealDataTable<Transaction>
          rows={ROWS}
          columns={COLUMNS}
          getRowId={(row) => row.id}
          pagination
          pageSize={5}
          groupBy={['category']}
          initialState={savedState}
          onStateChange={handleStateChange}
        />
      </div>
    </div>
  );
}
