import { useState, useMemo, useEffect } from 'react';
import { EssealTable, type GridColDef, type GridAction } from './EssealTable';

// --- 1. Mock Data Generator
interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Pending' | 'Inactive' | 'Banned';
  department: string;
  lastLogin: string;
  budget: number;
}

const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Legal', 'Product'];
const ROLES = ['Frontend Dev', 'Backend Dev', 'Manager', 'Designer', 'Director', 'Intern'];
const STATUSES = ['Active', 'Pending', 'Inactive', 'Banned'] as const;
const NAMES = ['Alice', 'Bob', 'Charlie', 'David', 'Eva', 'Frank', 'Grace', 'Hannah', 'Ian', 'Jack'];
const SURNAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

const generateData = (count: number): UserRow[] => {
  return Array.from({ length: count }, (_, index) => {
    const name = `${NAMES[Math.floor(Math.random() * NAMES.length)]} ${SURNAMES[Math.floor(Math.random() * SURNAMES.length)]}`;
    const dept = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
    return {
      id: index + 1,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      department: dept,
      role: ROLES[Math.floor(Math.random() * ROLES.length)],
      status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
      lastLogin: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
      budget: Math.floor(Math.random() * 100000) + 20000,
    };
  });
};


export default function App() {
  // Data State
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Grid Feature State
  const [groupBy, setGroupBy] = useState<(keyof UserRow)[]>([]);
  const [showCheckboxes, setShowCheckboxes] = useState(true);
  const [enablePagination, setEnablePagination] = useState(true);
  const [selection, setSelection] = useState<(string | number)[]>([]);

  // Load Initial Data
  useEffect(() => {
    // Simulate API Load
    setTimeout(() => {
      setRows(generateData(500));
      setLoading(false);
    }, 600);
  }, []);

  // Columns Configuration
  const columns = useMemo<GridColDef<UserRow>[]>(() => [
    { field: 'id', headerName: 'ID', width: 60, pinned: 'left' },
    { field: 'name', headerName: 'Full Name', width: 180, pinned: 'left' },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: ({ value }) => {
        const colors: Record<string, string> = {
          Active: '#dcfce7', Pending: '#fef9c3', Inactive: '#f3f4f6', Banned: '#fee2e2'
        };
        const text: Record<string, string> = {
          Active: '#166534', Pending: '#854d0e', Inactive: '#374151', Banned: '#991b1b'
        };
        return (
          <span style={{ background: colors[value], color: text[value], padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
            {value}
          </span>
        );
      }
    },
    { field: 'department', headerName: 'Department', width: 150 },
    { field: 'role', headerName: 'Job Role', width: 150 },
    {
      field: 'budget',
      headerName: 'Budget',
      width: 130,
      renderCell: ({ value }) => <span style={{ fontFamily: 'monospace' }}>${value.toLocaleString()}</span>
    },
    { field: 'email', headerName: 'Email', width: 220 },
    { field: 'lastLogin', headerName: 'Last Login', width: 120 },
  ], []);

  // Row Actions Definition
  const rowActions = (row: UserRow): GridAction<UserRow>[] => [
    { label: 'Edit', onClick: () => alert(`Edit ${row.name}`) },
    { label: 'Delete', onClick: () => alert(`Delete ${row.name}`) },
  ];

  // Helper to toggle grouping fields
  const toggleGroupBy = (field: keyof UserRow) => {
    setGroupBy(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  return (
    <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* --- Header Section --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>EssealTable</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
              Interactive Sandbox · {rows.length} rows loaded
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 800); }}
            style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
          >
            ⟳ Reload Data
          </button>
        </div>

        {/* --- Controls Toolbar --- */}
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>

          {/* Grouping Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', minWidth: '70px' }}>Group By:</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['department', 'role', 'status'].map((field) => {
                const isActive = groupBy.includes(field as keyof UserRow);
                return (
                  <button
                    key={field}
                    onClick={() => toggleGroupBy(field as keyof UserRow)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: `1px solid ${isActive ? '#0ea5e9' : '#e2e8f0'}`,
                      background: isActive ? '#e0f2fe' : 'white',
                      color: isActive ? '#0284c7' : '#64748b',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                    {isActive && <span style={{ marginLeft: '6px' }}>×</span>}
                  </button>
                );
              })}
            </div>
            {groupBy.length > 0 && (
              <button onClick={() => setGroupBy([])} style={{ fontSize: '12px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Clear Grouping
              </button>
            )}
          </div>

          <div style={{ height: '1px', background: '#f1f5f9' }} />

          {/* Feature Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', minWidth: '70px' }}>Settings:</span>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showCheckboxes} onChange={e => setShowCheckboxes(e.target.checked)} />
              Show Checkboxes
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input type="checkbox" checked={enablePagination} onChange={e => setEnablePagination(e.target.checked)} />
              Enable Pagination
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input type="checkbox" checked={loading} onChange={e => setLoading(e.target.checked)} />
              Force Loading State
            </label>
          </div>
        </div>

        {/* --- The Table --- */}
        <div style={{ height: '600px', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
          <EssealTable
            rows={rows}
            columns={columns}

            // Dynamic Props
            groupBy={groupBy}
            loading={loading}
            checkboxSelection={showCheckboxes}
            pagination={enablePagination}
            pageSize={50}

            // Layout
            rowHeight={42}
            height={600}

            // Actions & Events
            rowActions={rowActions}
            onSelectionChange={setSelection}
          />
        </div>

        {/* --- Selection Footer --- */}
        <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'right' }}>
          Selected IDs: {selection.length > 0 ? selection.join(', ') : 'None'}
        </div>

      </div>
    </div>
  );
}