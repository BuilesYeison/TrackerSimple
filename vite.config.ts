import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',

			strategies: 'generateSW',   // explícito, no asumir default

			includeAssets: ['favicon.svg', 'robots.txt', 'pwa-192x192.png', 'pwa-512x512.png'],

			manifest: {
				name: 'PersonalFinAppV2',
				short_name: 'FinApp',
				description: 'Gestión de finanzas personales',
				theme_color: '#1e1e2e',
				background_color: '#1e1e2e',
				display: 'standalone',
				start_url: '/',
				scope: '/',
				icons: [
					{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
					{ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
				]
			},

			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,ico,png,json}'],
				navigateFallback: '/',
				navigateFallbackDenylist: [/^\/api\//],
				cleanupOutdatedCaches: true
			},

			devOptions: {
				enabled: true,
				type: 'module',
				navigateFallback: '/'
			}
		})
	],
	server: { host: true },
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});