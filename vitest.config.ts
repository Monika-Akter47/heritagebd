import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Frontend unit tests (npm run test:frontend). Kept separate from vite.config.ts so the
// Figma Make dev plugins are not loaded in tests.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    include: ['tests/frontend/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    reporters: ['default', 'junit'],
    outputFile: { junit: 'docs/testing/evidence/junit-frontend.xml' },
    coverage: {
      provider: 'v8',
      include: ['src/components/ui/PaymentProofFields.tsx', 'src/components/ui/StatusBadge.tsx', 'src/services/api.ts'],
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: 'docs/testing/evidence/coverage-frontend',
    },
  },
});
