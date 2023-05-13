import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5500,
  },
  resolve: {
    alias: {
      "@shared": path.resolve("../server/src/shared"),
    },
  },
})
