import { defineConfig } from "vite"
import path from "path"

export default defineConfig({
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
