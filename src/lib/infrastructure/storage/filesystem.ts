import { Filesystem, Directory } from '@capacitor/filesystem';

const BASE_DIR = 'PersonalFinApp';

export async function createWorkspace(): Promise<void> {
	await Filesystem.mkdir({ path: BASE_DIR, directory: Directory.Documents, recursive: true });
	await Filesystem.mkdir({ path: `${BASE_DIR}/records`, directory: Directory.Documents, recursive: true });
}

export async function readJSON<T>(path: string): Promise<T | null> {
	try {
		const result = await Filesystem.readFile({
			path: `${BASE_DIR}/${path}`,
			directory: Directory.Documents,
		});
		return JSON.parse(result.data as string) as T;
	} catch {
		return null;
	}
}

export async function writeJSON(path: string, data: unknown): Promise<void> {
	await Filesystem.writeFile({
		path: `${BASE_DIR}/${path}`,
		data: JSON.stringify(data, null, 2),
		directory: Directory.Documents,
		recursive: true,
	});
}

export async function listDir(path: string): Promise<string[]> {
	try {
		const result = await Filesystem.readdir({
			path: `${BASE_DIR}/${path}`,
			directory: Directory.Documents,
		});
		return result.files.map((f) => f.name);
	} catch {
		return [];
	}
}

export async function deleteFile(path: string): Promise<void> {
	try {
		await Filesystem.deleteFile({
			path: `${BASE_DIR}/${path}`,
			directory: Directory.Documents,
		});
	} catch {
		// Ignore if file doesn't exist
	}
}
