import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'dev.personalfinapp',
	appName: 'PersonalFinApp',
	webDir: 'build',
	server: {
		androidScheme: 'https',
	},
	plugins: {
		CapacitorSQLite: {
			iosDatabaseLocation: 'Library/CapacitorDatabase',
			iosIsEncryption: false,
			androidIsEncryption: false,
		},
	},
};

export default config;
