import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
	console.warn('🦕 vite.config.ts/defineConfig', command, mode)
	return {
		base: mode === 'development' ? './' : '/shared-worker-demo/',
	}
})
