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
    
    // Optimize for smaller chunks
    rollupOptions: {
      output: {
        // Conservative manual chunks. Keep ecosystems together to avoid
        // cross-chunk Temporal Dead Zone (TDZ) crashes like
        // "Cannot access 'X' before initialization" that show up as a blank
        // page in production. Do NOT add a catch-all 'vendor' bucket — let
        // Rollup's default splitting handle anything not listed here.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Keep react, react-dom, scheduler, jsx-runtime AND react-router
          // in a single chunk. Splitting them produces init-order bugs.
          if (
            id.includes('/react-router') ||
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('/scheduler/')
          ) {
            return 'vendor-react';
          }
          // Keep ALL @supabase/* together (supabase-js imports realtime,
          // gotrue, postgrest, storage — splitting causes TDZ).
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('@radix-ui')) return 'vendor-radix';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('xlsx')) return 'vendor-xlsx';
          if (id.includes('i18next')) return 'vendor-i18n';
          if (id.includes('lucide-react')) return 'vendor-icons';
          // Everything else: leave to Rollup default (do not bucket).
          return undefined;
        },
      },
    },

    
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
