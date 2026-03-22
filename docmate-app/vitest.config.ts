import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/__tests__/setup.ts"],
        include: ["src/**/*.test.{ts,tsx}"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            include: [
                "src/lib/**",
                "src/models/**",
                "src/app/api/**",
                "src/components/**",
            ],
            exclude: ["src/__tests__/**"],
        },
    },
});
