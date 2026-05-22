import { snapshotToOPFS, exportToZip } from "../../infrastructure/storage/snapshot-exporter";
import { restoreFromSnapshot, importFromFile } from "../../infrastructure/storage/snapshot-importer";
import { snapshotExists } from "../../infrastructure/storage/opfs";

export class SnapshotService {
	async createSnapshot(): Promise<void> {
		try {
			await snapshotToOPFS();
		} catch (error: any) {
			console.error(error)
			// Silently ignore OPFS errors — no interrumpen al usuario
		}
	}

	async restoreFromOPFS(): Promise<boolean> {
		try {
			return await restoreFromSnapshot();
		} catch {
			return false;
		}
	}

	async hasSnapshot(): Promise<boolean> {
		try {
			return await snapshotExists();
		} catch {
			return false;
		}
	}

	async exportToZip(): Promise<void> {
		await exportToZip();
	}

	async importFromFile(file: File): Promise<void> {
		await importFromFile(file);
	}
}
