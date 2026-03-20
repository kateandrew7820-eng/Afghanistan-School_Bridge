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
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    // Target modern browsers for smaller bundles
    target: "es2020",
    
    // Aggressive minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 3,
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
    
    // Optimize for smaller chunks
    rollupOptions: {
      output: {
        // Manual chunk strategy for better code splitting
        manualChunks: {
          // Core dependencies
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'react-hook-form'],
          // UI library
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-alert-dialog', '@radix-ui/react-accordion'],
          // Backend
          'vendor-supabase': ['@supabase/supabase-js'],
          // i18n
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          // Data visualization
          'vendor-charts': ['recharts'],
          // Utilities
          'vendor-utils': ['date-fns', 'zod', 'clsx', 'tailwind-merge', 'class-variance-authority'],
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
    // Exclude large libraries to be loaded on demand
    exclude: ['recharts'],
  },
}));
