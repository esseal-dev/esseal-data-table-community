import { useState, useMemo, useEffect } from 'react';
import { EssealDataTable, type GridColDef, type GridAction, type TableState } from './EssealDataTable';

// --- Types & Constants ---
type Density = 'compact' | 'standard' | 'comfortable';

const DENSITY_OPTIONS: Record<Density, number> = {
  compact: 35,
  standard: 45,
  comfortable: 55
};

// --- Mock Data Generator ---
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

const generateData = (count: number): UserRow[] => {
  const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Legal', 'Product'];
  const ROLES = ['Frontend Dev', 'Backend Dev', 'Manager', 'Designer', 'Director', 'Intern'];
  const STATUSES = ['Active', 'Pending', 'Inactive', 'Banned'] as const;
  const NAMES = ['Alice', 'Bob', 'Charlie', 'David', 'Eva', 'Frank', 'Grace', 'Hannah', 'Ian', 'Jack'];
  const SURNAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

  return Array.from({ length: count }, (_, index) => {
    const name = `${NAMES[Math.floor(Math.random() * NAMES.length)]} ${SURNAMES[Math.floor(Math.random() * SURNAMES.length)]}`;
    return {
      id: index + 1,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
      role: ROLES[Math.floor(Math.random() * ROLES.length)],
      status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
      lastLogin: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
      budget: Math.floor(Math.random() * 100000) + 20000,
    };
  });
};

export default function App() {
  // --- Data State ---
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Grid State ---
  const [density, setDensity] = useState<Density>('standard'); // New: Density
  const [groupBy, setGroupBy] = useState<(keyof UserRow)[]>([]);
  const [selection, setSelection] = useState<(string | number)[]>([]);

  // --- Toggles ---
  const [showCheckboxes, setShowCheckboxes] = useState(true);
  const [enablePagination, setEnablePagination] = useState(true);

  // Load Data
  useEffect(() => {
    setTimeout(() => {
      setRows(generateData(500));
      setLoading(false);
    }, 600);
  }, []);

  // Columns
  const columns = useMemo<GridColDef<UserRow>[]>(() => [
    { field: 'id', headerName: 'ID', width: 60, pinned: 'left' },
    { field: 'name', headerName: 'Full Name', width: 180, pinned: 'left' },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: ({ value }: { value: ColorThemeKeyType }) => {
        const colors: ColorTheme = { Active: '#dcfce7', Pending: '#fef9c3', Inactive: '#f3f4f6', Banned: '#fee2e2' };
        const text: ColorTheme = { Active: '#166534', Pending: '#854d0e', Inactive: '#374151', Banned: '#991b1b' };
        return (
          <span style={{
            background: colors[value], color: text[value],
            padding: '2px 8px', borderRadius: '12px',
            fontSize: '11px', fontWeight: 600
          }}>
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

  // Actions
  const rowActions = (row: UserRow): GridAction<UserRow>[] => [
    { label: 'Edit', onClick: () => alert(`Edit ${row.name}`) },
    { label: 'Delete', onClick: () => alert(`Delete ${row.name}`) },
    { label: 'View Profile', onClick: () => console.log('View', row.id) },
  ];

  // Styles Helper
  const btnStyle = (active: boolean) => ({
    padding: '6px 12px', fontSize: '12px', cursor: 'pointer',
    border: '1px solid #cbd5e1', background: active ? '#0f172a' : 'white',
    color: active ? 'white' : '#64748b', flex: 1, textAlign: 'center' as const
  });

  const handleStateChange = (newState: TableState) => {
    console.log('%c Table State Updated:', 'color: #0ea5e9; font-weight: bold;', newState);

    // Example of how you would access specific parts:
    // console.log('Current Page:', newState.page);
    // console.log('Active Filters:', newState.filterModel);
    // console.log('Sort Config:', newState.sortModel);
  };


  return (
    <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* --- Header & Reload --- */}
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

        {/* --- Toolbar --- */}
        <div style={{
          background: 'white', padding: '12px 16px', borderRadius: '8px',
          border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
        }}>

          {/* Left: Grouping */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Group By:</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['department', 'role'].map((field) => {
                const isActive = groupBy.includes(field as keyof UserRow);
                return (
                  // eslint-disable-next-line
                  <button key={field} onClick={() => setGroupBy(p => p.includes(field as any) ? [] : [field as any])}
                    style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                      border: `1px solid ${isActive ? '#0ea5e9' : '#e2e8f0'}`,
                      background: isActive ? '#e0f2fe' : 'white', color: isActive ? '#0284c7' : '#64748b'
                    }}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Density & Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

            {/* Toggles */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{ fontSize: '12px', display: 'flex', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showCheckboxes} onChange={e => setShowCheckboxes(e.target.checked)} /> Checkboxes
              </label>
              <label style={{ fontSize: '12px', display: 'flex', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={enablePagination} onChange={e => setEnablePagination(e.target.checked)} /> Pagination
              </label>
            </div>

            {/* Density Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Density:</span>
              <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                <button style={{ ...btnStyle(density === 'compact'), border: 'none', borderRight: '1px solid #cbd5e1' }} onClick={() => setDensity('compact')}>Compact</button>
                <button style={{ ...btnStyle(density === 'standard'), border: 'none', borderRight: '1px solid #cbd5e1' }} onClick={() => setDensity('standard')}>Standard</button>
                <button style={{ ...btnStyle(density === 'comfortable'), border: 'none' }} onClick={() => setDensity('comfortable')}>Comfortable</button>
              </div>
            </div>
          </div>
        </div>

        {/* --- Table --- */}
        <div style={{ height: '600px', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <EssealDataTable
            rows={rows}
            columns={columns}
            loading={loading}

            // Layout & Props
            rowHeight={DENSITY_OPTIONS[density]} // Dynamic Height
            groupBy={groupBy}
            checkboxSelection={showCheckboxes}
            pagination={enablePagination}
            pageSize={50}

            // Actions & Events
            rowActions={rowActions}
            onSelectionChange={setSelection}
            onStateChange={handleStateChange}
          />
        </div>

        {/* --- Footer Selection --- */}
        <div style={{ textAlign: 'right', fontSize: '13px', color: '#64748b' }}>
          {selection.length > 0 ? (
            <span style={{ color: '#0369a1', background: '#e0f2fe', padding: '4px 8px', borderRadius: '4px' }}>
              {selection.length} row(s) selected
            </span>
          ) : 'No rows selected'}
        </div>

      </div>
    </div>
  );
}

interface ColorTheme { Active: string, Pending: string, Inactive: string, Banned: string }
type ColorThemeKeyType = 'Active' | 'Pending' | 'Inactive' | 'Banned'