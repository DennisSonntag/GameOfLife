/* eslint-disable linebreak-style */
import { defineConfig } from 'vite'

export default defineConfig({
	server: {
		watch: {
			usePolling: true,
		},
	},
})
