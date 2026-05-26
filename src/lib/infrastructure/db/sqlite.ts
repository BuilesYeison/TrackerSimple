import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import type { SQLiteDBConnection } from '@capacitor-community/sqlite/dist/esm/definitions';

const sqliteConnection = new SQLiteConnection(CapacitorSQLite);
const DB_NAME = 'trackersimple';
const TARGET_VERSION = 3;
let db: SQLiteDBConnection | null = null;

export async function initDatabase(): Promise<void> {
	const isConn = (await sqliteConnection.isConnection(DB_NAME, false)).result;

	if (isConn) {
		db = await sqliteConnection.retrieveConnection(DB_NAME, false);
	} else {
		db = await sqliteConnection.createConnection(DB_NAME, false, 'no-encryption', TARGET_VERSION, false);
	}

	await db.open();

	await createInitialSchema();
	await runMigrations();
}

async function getCurrentVersion(): Promise<number> {
	const result = await db!.query('PRAGMA user_version');
	return Number(result.values?.[0]?.user_version ?? 0);
}

async function setVersion(version: number): Promise<void> {
	await db!.execute(`PRAGMA user_version = ${version}`);
}

async function createInitialSchema(): Promise<void> {
	await db!.execute(`
		CREATE TABLE IF NOT EXISTS accounts (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			type TEXT NOT NULL,
			currency TEXT NOT NULL,
			balance REAL DEFAULT 0,
			isActive INTEGER DEFAULT 1,
			createdAt TEXT NOT NULL,
			updatedAt TEXT NOT NULL
		)
	`);

	await db!.execute(`
		CREATE TABLE IF NOT EXISTS categories (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL UNIQUE,
			type TEXT NOT NULL,
			isDefault INTEGER DEFAULT 0,
			createdAt TEXT NOT NULL,
			updatedAt TEXT NOT NULL
		)
	`);

	await db!.execute(`
		CREATE TABLE IF NOT EXISTS records (
			id TEXT PRIMARY KEY,
			type TEXT NOT NULL,
			amount REAL NOT NULL,
			accountId TEXT NOT NULL,
			toAccountId TEXT,
			categoryId TEXT NOT NULL,
			note TEXT,
			date TEXT NOT NULL,
			createdAt TEXT NOT NULL,
			updatedAt TEXT NOT NULL
		)
	`);

	await db!.execute(`
		CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			currency TEXT NOT NULL DEFAULT 'COP',
			onboardingCompleted INTEGER DEFAULT 0,
			lastBackupAt TEXT
		)
	`);
}

async function runMigrations(): Promise<void> {
	const current = await getCurrentVersion();

	if (current < 1) {
		await setVersion(1);
	}

	if (current < 2) {
		await db!.execute(`CREATE INDEX IF NOT EXISTS idx_records_date ON records(date)`);
		await db!.execute(`CREATE INDEX IF NOT EXISTS idx_records_accountId ON records(accountId)`);
		await db!.execute(`CREATE INDEX IF NOT EXISTS idx_records_categoryId ON records(categoryId)`);
		await db!.execute(`CREATE INDEX IF NOT EXISTS idx_records_toAccountId ON records(toAccountId)`);
		await db!.execute(`CREATE INDEX IF NOT EXISTS idx_categories_isDefault ON categories(isDefault)`);
		await db!.execute(`CREATE INDEX IF NOT EXISTS idx_accounts_isActive ON accounts(isActive)`);

		try {
			await db!.execute(`ALTER TABLE records ADD COLUMN tag TEXT`);
		} catch {
			// Column already exists
		}

		await setVersion(2);
	}

	if (current < 3) {
		try { await db!.execute(`ALTER TABLE settings ADD COLUMN safUri TEXT`); } catch { /* already exists */ }
		try { await db!.execute(`ALTER TABLE settings ADD COLUMN lastSyncAt TEXT`); } catch { /* already exists */ }

		await setVersion(3);
	}
}

export async function closeDatabase(): Promise<void> {
	if (db) {
		try {
			await db.close();
			await sqliteConnection.closeConnection(DB_NAME, false);
		} catch {
			// Ignore close errors
		}
		db = null;
	}
}

export function getDB(): SQLiteDBConnection {
	if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
	return db;
}
