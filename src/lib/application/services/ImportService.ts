import { importBackupFromFile } from '../../utils/import-backup';

export class ImportService {
	async importFromFile(file: File): Promise<void> {
		await importBackupFromFile(file);
	}
}
