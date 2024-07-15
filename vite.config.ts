import path from 'pathe'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  build: {
    minify: false,
    // Use Vite lib mode https://vitejs.dev/guide/build.html#library-mode
    lib: {
      entry: path.resolve(__dirname, './src/main.ts'),
      formats: ['cjs']
    },
    rollupOptions: {
      output: {
        // Overwrite default Vite output fileName
        entryFileNames: 'main.js',
        assetFileNames: 'styles.css'
      },
      external: ['obsidian']
    },
	watch: {
		include: /src\/.*\.ts/,
	},
    // Use root as the output dir
    emptyOutDir: false,
    outDir: '.'
  }
})
