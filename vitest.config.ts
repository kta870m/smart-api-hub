import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    globals: true,
    // Chạy test files tuần tự, không song song (tránh xung đột DB)
    fileParallelism: false,
    // Timeout cho mỗi test (ms)
    testTimeout: 15000,
  },
});
