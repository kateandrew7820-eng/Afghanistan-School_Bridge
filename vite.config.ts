import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query"],
  },
  build: {
    target: "es2020",
    minify: 'esbuild',
    
    // NOTE: no custom manualChunks.
    // A hand-written manualChunks map produced circular chunk graphs
    // (vendor-react imported a CJS interop helper from vendor-charts while
    // vendor-charts imported React from vendor-react), which crashes at
    // startup with "Cannot access 'S' before initialization" and a blank
    // page. Rollup's default splitting is cycle-safe — do not reintroduce
    // a manual vendor chunk map.


    
    // Report compressed size
    reportCompressedSize: true,
    
    // Strict chunk size warning
    chunkSizeWarningLimit: 800,
    
    // Enable source maps for production debugging (can be disabled in final build)
    sourcemap: false,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'i18next',
      'react-i18next',
      'react-hook-form',
      '@tanstack/react-query',
    ],
  },
}));
