import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.app.json', // references your app config
      rollupTypes: true // merges types into a single file if possible
    })
  ],
  build: {
    lib: {
      // The entry point we created above
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'EssealDataTable',
      // The name of the output files (e.g., esseal-data-table.js)
      fileName: 'esseal-data-table',
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});