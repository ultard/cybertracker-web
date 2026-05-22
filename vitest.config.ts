import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'~': path.resolve(__dirname, 'app')
		}
	},
	test: {
		environment: 'jsdom',
		setupFiles: ['./tests/setup.ts'],
		include: ['**/*.{test,spec}.{ts,tsx}'],
		exclude: ['e2e/**', 'node_modules/**'],
		server: {
			deps: {
				inline: ['radix-ui']
			}
		}
	}
});
