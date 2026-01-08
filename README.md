EssealTable
A high-performance, feature-rich Data Grid for React applications. Built with performance and flexibility in mind, EssealTable handles large datasets effortlessly via virtualization and gives developers total control over state persistence through an "Inversion of Control" architecture.

🚀 Key FeaturesVirtualization: Efficiently renders thousands of rows by only drawing what is currently visible in the viewport.Flexible Persistence: Save and restore table states (sorting, filtering, pinning, column visibility, density) to any storage backend (LocalStorage, Database, or URL).Interactive Column Management:User-Controlled Pinning: Users can pin columns to the Left or Right via a header menu.Visibility Picker: Toggle columns on/off via a built-in toolbar menu.Resizing: Robust drag-and-drop column width adjustment.Grouping & Aggregation: Hierarchical data grouping with collapsible sections and persistence.Sticky Headers & Columns: Keep context while scrolling through large datasets.Built-in Action System: Support for row-level actions with an automated overflow menu.Pagination & Selection: Standardized checkbox selection and footer-based pagination.📦 InstallationInclude the EssealTable.tsx component in your project. It is self-contained with embedded CSS for maximum portability.💾 State Persistence (Advanced)EssealTable allows you to handle persistence however you like by passing a function to onStateChange.Example: LocalStorage Integrationimport { EssealTable, TableState } from './EssealTable';

export const MyPersistentTable = () => {
// 1. Load saved state from your storage of choice
const savedState = JSON.parse(localStorage.getItem('table-prefs') || '{}');

// 2. Define how to save the state when it changes
const handleStateChange = (newState: TableState) => {
localStorage.setItem('table-prefs', JSON.stringify(newState));
console.log('State saved:', newState);
};

return (
<EssealTable
rows={myRows}
columns={myColumns}
initialState={savedState} // Rehydrate state
onStateChange={handleStateChange} // Save on updates
pagination={true}
/>
);
};
⚙️ API ReferenceDataGridProps<T>PropTypeDescriptionrowsT[]The data to be displayed (requires an id field).columnsGridColDef[]Column definitions.heightnumberTotal height of the table container (px). Default: 600.rowHeightnumberDefault height of each row (px). Default: 40.loadingbooleanDisplays a loading overlay.initialStatePartial<TableState>The state to apply on first load.onStateChange(state: TableState) => voidFired on sort, filter, pin, or page change.rowActions(row: T) => GridAction[]Returns an array of actions for each row.groupBy(keyof T)[]Default array of keys to group data by.checkboxSelectionbooleanEnable/disable row selection checkboxes.TableState ObjectThe state object provided to onStateChange (and accepted by initialState) includes:page: Current page number.sortModel: Current active sort (field and direction).filterModel: Active filter strings per column.expandedGroups: Map of which group IDs are toggled open.groupBy: Current grouping configuration.rowHeight: The user's selected density/height.columnVisibility: Map of hidden/visible columns.pinnedColumns: Map of column pinning (left/right/false).🎨 ThemingThe table uses CSS variables. Override these in your global stylesheet to match your brand::root {
--dg-primary: #0ea5e9;
--dg-surface: #ffffff;
--dg-border: #e2e8f0;
--dg-text-primary: #0f172a;
}
