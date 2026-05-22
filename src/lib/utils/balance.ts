import type { Account } from "$lib/domain/entities";
import type { RecordService } from "$lib/application/services/RecordService";

export async function calcBalance(
	account: Account,
	recordService: RecordService,
): Promise<number> {
	const records = await recordService.getByAccount(account.id);
	let balance = account.balance;
	for (const r of records) {
		if (r.type === "income" && r.accountId === account.id)
			balance += r.amount;
		if (r.type === "expense" && r.accountId === account.id)
			balance -= r.amount;
		if (r.type === "transfer" && r.accountId === account.id)
			balance -= r.amount;
		if (r.type === "transfer" && r.toAccountId === account.id)
			balance += r.amount;
	}
	return balance;
}
