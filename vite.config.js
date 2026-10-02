import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), {
    name: "portfolio-design-preview",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.split("?")[0].replace(/\/$/, "") === "/portfolio/design-preview/portfolio") {
          req.url = req.url.replace("/design-preview/portfolio", "/design-preview.html");
        }
        next();
      });
    },
  }],
  // server: {
  //   port: 8000,
  // },
  base: mode === 'firebase' ? '/' : '/portfolio/',
  build: {
    outDir: "build",
  },
}));
