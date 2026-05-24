import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const BASE_DIR = 'PersonalFinApp';

export async function createWorkspace(): Promise<void> {
	try {
		await Filesystem.mkdir({ path: BASE_DIR, directory: Directory.Documents, recursive: true });
		await Filesystem.mkdir({ path: `${BASE_DIR}/records`, directory: Directory.Documents, recursive: true });
	} catch {
		// Directory might already exist
	}
}

function sanitize(data: unknown): unknown {
	return JSON.parse(JSON.stringify(data));
}

export async function readJSON<T>(path: string): Promise<T | null> {
	if (!path) return null;
	try {
		const result = await Filesystem.readFile({
			path: `${BASE_DIR}/${path}`,
			directory: Directory.Documents,
			encoding: Encoding.UTF8,
		});
		return JSON.parse(result.data as string) as T;
	} catch {
		return null;
	}
}

export async function writeJSON(path: string, data: unknown): Promise<void> {
	try {
		const safe = sanitize(data);
		console.log(safe)
		await Filesystem.writeFile({
			path: `${BASE_DIR}/${path}`,
			data: JSON.stringify(safe, null, 2),
			directory: Directory.Documents,
			recursive: true,
			encoding: Encoding.UTF8,
		});
	} catch (err) {
		console.warn('writeJSON failed:', path, err);
	}
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
