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
        // Manual chunk strategy for better code splitting
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'vendor-react';
          if (id.includes('@radix-ui')) return 'vendor-radix';
          if (id.includes('@supabase/realtime')) return 'vendor-supabase-realtime';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('xlsx')) return 'vendor-xlsx';
          if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
          if (id.includes('date-fns')) return 'vendor-date';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('@tanstack')) return 'vendor-query';
          if (id.includes('cmdk')) return 'vendor-cmdk';
          return 'vendor';
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
