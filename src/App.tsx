import { useState, useMemo, useEffect } from 'react';
import { EssealTable, type GridAction, type GridColDef } from './EssealTable';

// --- 1. Mock Data Generator ---
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

// --- 2. Main App Component ---
export default function App() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<(string | number)[]>([]);

  // Simulate data fetching
  useEffect(() => {
    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setRows(generateData(1000));
      setLoading(false);
    }, 800);
  }, []);

  // --- Column Definitions ---
  const columns = useMemo<GridColDef<UserRow>[]>(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
      pinned: 'left' // Pin ID to the left
    },
    {
      field: 'name',
      headerName: 'Full Name',
      width: 180,
      pinned: 'left' // Pin Name to the left as well
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      // Custom Renderer Example: Badges
      renderCell: ({ value }) => {
        let bg = '#f3f4f6';
        let color = '#374151';

        switch (value) {
          case 'Active': bg = '#dcfce7'; color = '#166534'; break;
          case 'Pending': bg = '#fef9c3'; color = '#854d0e'; break;
          case 'Banned': bg = '#fee2e2'; color = '#991b1b'; break;
        }

        return (
          <span style={{
            background: bg,
            color: color,
            padding: '2px 10px',
            borderRadius: '99px',
            fontSize: '12px',
            fontWeight: 500
          }}>
            {value}
          </span>
        );
      }
    },
    { field: 'email', headerName: 'Email Address', width: 220 },
    { field: 'department', headerName: 'Department', width: 150 },
    { field: 'role', headerName: 'Job Role', width: 150 },
    {
      field: 'budget',
      headerName: 'Annual Budget',
      width: 140,
      // Custom Renderer: Currency Formatting
      renderCell: ({ value }) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
          ${value.toLocaleString()}
        </span>
      )
    },
    { field: 'lastLogin', headerName: 'Last Login', width: 120 },
  ], []);

  // --- Row Actions ---
  const getRowActions = (row: UserRow): GridAction<UserRow>[] => {
    return [
      {
        label: 'Edit',
        onClick: (r) => alert(`Editing user: ${r.name}`),
      },
      {
        label: 'View Profile',
        onClick: (r) => console.log('View profile', r.id),
      },
      {
        label: 'Delete',
        onClick: (r) => {
          if (confirm(`Are you sure you want to delete ${r.name}?`)) {
            setRows(prev => prev.filter(x => x.id !== r.id));
          }
        },
      }
    ];
  };

  return (
    <div style={{
      padding: '40px',
      background: '#f1f5f9',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
              EssealTable Demo
            </h1>
            <p style={{ color: '#64748b', marginTop: '4px' }}>
              High performance DataGrid with 1,000 virtualized rows.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 1000);
              }}
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
            >
              Reload Data
            </button>
          </div>
        </div>

        {/* Selected Items Summary */}
        {selection.length > 0 && (
          <div style={{
            marginBottom: '16px',
            padding: '10px',
            background: '#e0f2fe',
            color: '#0369a1',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            <strong>{selection.length}</strong> row(s) selected.
          </div>
        )}

        {/* --- THE GRID COMPONENT --- */}
        <EssealTable
          rows={rows}
          columns={columns}
          height={600}
          rowHeight={45}

          // Features
          loading={loading}
          checkboxSelection={true}
          pagination={true}
          pageSize={50} // 50 rows per page

          // Try grouping by Department!
          // groupBy={['department']} 

          // Actions
          rowActions={getRowActions}
          maxVisibleActions={1} // Show 1 button, put rest in menu

          // Events
          onSelectionChange={(ids) => setSelection(ids)}
        />

      </div>
    </div>
  );
}