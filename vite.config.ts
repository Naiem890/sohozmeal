import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Raise warning threshold — chunked builds naturally produce more files
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — cached separately, changes rarely
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // Auth — small, isolated
          "auth-vendor": ["react-auth-kit"],
          // All Radix UI primitives bundled together
          "radix-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-tooltip",
          ],
          // Icons — large, rarely changes
          "icons-vendor": ["lucide-react", "@heroicons/react"],
          // HTTP + utility libraries
          "utils-vendor": ["axios", "clsx", "tailwind-merge", "class-variance-authority"],
          // Date libraries
          "date-vendor": ["date-fns", "react-datepicker", "react-day-picker"],
          // Excel export — only used in a few admin pages
          "excel-vendor": ["xlsx", "file-saver"],
        },
      },
    },
  },
});
