import path from 'path'; // Required for path resolution in aliases

import { defineConfig } from 'vite'; // Vite configuration helper (FIXED SYNTAX HERE!)
import react from '@vitejs/plugin-react'; // Vite plugin for React projects

// Vite configuration for the frontend application
export default defineConfig({
  // Integrate the React plugin for Vite
  plugins: [react()],

  // Configure module resolution, specifically for path aliases
  resolve: {
    // This alias maps '@' to the 'src' directory.
    // So, imports like `import MyComponent from '@/components/MyComponent'` will correctly
    // resolve to `src/components/MyComponent`.
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Configure the development server
  server: {
    // `host: true` makes the server accessible from external networks,
    // which is essential for GitPod to expose the application to your browser.
    host: true,

    // Defines the port the development server will run on.
    // This should match the port GitPod exposes (e.g., 5173).
    port: 5173,

    // CRITICAL FIX FOR HMR WEBSOCKET:
    // Explicitly defines how the HMR client should connect back to the server.
    // This bypasses issues where the client tries to guess the WebSocket URL.
    hmr: {
      client: {
        // Use the CURRENT dynamic GitPod hostname for the WebSocket connection.
        webSocketURL: `wss://5173-jamesfx30-votingsystemf-j6tl0jobb3p.ws-eu120.gitpod.io/ws`, // <-- CURRENT HOSTNAME HERE!
      },
    },

    // IMPORTANT: `allowedHosts` now explicitly lists the CURRENT GitPod hostname.
    allowedHosts: ["5173-jamesfx30-votingsystemf-j6tl0jobb3p.ws-eu120.gitpod.io"] // <-- CURRENT HOSTNAME HERE!
  }
});
