export type SqliteRow = Record<string, unknown>;

export function toISO(d: Date): string {
	return d.toISOString();
}
