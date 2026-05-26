import { registerPlugin } from '@capacitor/core';

export interface SafPlugin {
	pickFolder(): Promise<{ uri: string }>;
	writeFile(options: { uri: string; name: string; data: string }): Promise<void>;
	readFile(options: { uri: string; name: string }): Promise<{ data: string }>;
	hasPermission(options: { uri: string }): Promise<{ valid: boolean }>;
}

export const SafPlugin = registerPlugin<SafPlugin>('SafPlugin');
