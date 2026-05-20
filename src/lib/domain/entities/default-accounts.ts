import type { AccountType, Currency } from './enums';

export interface DefaultAccountDef {
    name: string;
    type: AccountType;
    currency: Currency
}

export const DEFAULT_ACCOUNTS: DefaultAccountDef[] = [
    { name: 'Efectivo', type: 'cash', currency: 'COP' }
];
