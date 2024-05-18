import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      include: ["src/**"]
    }
  }
})