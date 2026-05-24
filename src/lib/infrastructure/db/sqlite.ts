import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import type { SQLiteDBConnection } from '@capacitor-community/sqlite/dist/esm/definitions';

const sqliteConnection = new SQLiteConnection(CapacitorSQLite);
const DB_NAME = 'personalfinapp';
let db: SQLiteDBConnection | null = null;

export async function initDatabase(): Promise<void> {
	const isConn = (await sqliteConnection.isConnection(DB_NAME, false)).result;

	if (isConn) {
		db = await sqliteConnection.retrieveConnection(DB_NAME, false);
	} else {
		db = await sqliteConnection.createConnection(DB_NAME, false, 'no-encryption', 1, false);
	}

	await db.open();

	await db.execute(`
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

	await db.execute(`
		CREATE TABLE IF NOT EXISTS categories (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL UNIQUE,
			type TEXT NOT NULL,
			isDefault INTEGER DEFAULT 0,
			createdAt TEXT NOT NULL,
			updatedAt TEXT NOT NULL
		)
	`);

	await db.execute(`
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

	await db.execute(`
		CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			currency TEXT NOT NULL DEFAULT 'COP',
			onboardingCompleted INTEGER DEFAULT 0,
			lastBackupAt TEXT
		)
	`);
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
