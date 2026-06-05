export interface AccountBalance {
	accountId: string;
	balance: number;
}

export interface MonthlyAggregate {
	month: string;
	income: number;
	expense: number;
}

export interface CategoryTotal {
	categoryId: string;
	total: number;
}
