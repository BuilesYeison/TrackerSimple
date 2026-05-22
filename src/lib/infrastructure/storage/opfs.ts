const WORKSPACE_DIR = "workspace";

export function isOPFSAvailable(): boolean {
	return typeof navigator?.storage?.getDirectory === "function";
}

async function getRoot(): Promise<FileSystemDirectoryHandle> {
	if (!isOPFSAvailable()) throw new Error("OPFS not available");
	return navigator.storage.getDirectory();
}

async function getWorkspaceDir(): Promise<FileSystemDirectoryHandle> {
	const root = await getRoot();
	return root.getDirectoryHandle(WORKSPACE_DIR, { create: true });
}

export async function writeSnapshot(
	filename: string,
	data: object,
): Promise<void> {
	if (!isOPFSAvailable()) return;
	try {
		const dir = await getWorkspaceDir();
		const fileHandle = await dir.getFileHandle(filename, { create: true });
		const writable = await fileHandle.createWritable();
		await writable.write(JSON.stringify(data, null, 2));
		await writable.close();
	} catch {
		// Silently ignore OPFS write errors
	}
}

export async function readSnapshot<T = object>(
	dirname: string,
): Promise<T | null> {
	if (!isOPFSAvailable()) return null;
	try {
		const root = await getRoot();
		const dir = await root.getDirectoryHandle(dirname);
		const fileHandle = await dir.getFileHandle("manifest.json");
		const file = await fileHandle.getFile();
		const text = await file.text();
		return JSON.parse(text) as T;
	} catch {
		return null;
	}
}

export async function snapshotExists(): Promise<boolean> {
	if (!isOPFSAvailable()) return false;
	try {
		const root = await getRoot();
		const dir = await root.getDirectoryHandle(WORKSPACE_DIR);
		const keys = Array.fromAsync(dir.keys());
		return (await keys).length > 0;
	} catch {
		return false;
	}
}
