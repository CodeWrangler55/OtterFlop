import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    base: "/OtterFlop/",
    plugins: [react()],
    test: {
        environment: "jsdom",
        setupFiles: "./src/test/setup.ts",
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            include: ["src/**/*.{ts,tsx}"],
            thresholds: {
                lines: 85,
                functions: 85,
                branches: 85,
                statements: 85
            },
            exclude: ["coverage/**", "src/main.tsx", "src/test/**", "vite.config.ts"]
        }
    }
});
