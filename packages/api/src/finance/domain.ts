export const categories = [
  'Groceries',
  'Dining',
  'Shopping',
  'Transport',
  'Housing',
  'Utilities',
  'Subscriptions',
  'Health',
  'Income',
  'Transfers',
  'Other',
] as const;
export type Category = (typeof categories)[number];
export type Accounting = 'spend' | 'income' | 'transfer' | 'unknown';
export type ProviderTransaction = {
  transaction_id: string;
  account_id: string;
  amount: number;
  iso_currency_code: string | null;
  date: string;
  name: string;
  merchant_name?: string | null;
  pending: boolean;
  pending_transaction_id?: string | null;
  personal_finance_category?: {
    primary: string;
    detailed: string;
    confidence_level: string;
  } | null;
};
export function minorUnits(value: number): number {
  if (!Number.isFinite(value)) throw new Error('Invalid financial amount');
  const cents =
    Math.round((Math.abs(value) + Number.EPSILON) * 100) * Math.sign(value);
  if (!Number.isSafeInteger(cents))
    throw new Error('Financial amount outside supported range');
  return cents;
}
export function classify(t: ProviderTransaction): {
  category: Category;
  categorySource: string;
  confidence: string;
  accounting: Accounting;
} {
  const p = t.personal_finance_category;
  const primary = p?.primary ?? '';
  const detailed = p?.detailed ?? '';
  // Only provider semantics determine accounting; merchant strings and LLM labels cannot authorize reclassification of cash.
  const transfer =
    primary.startsWith('TRANSFER') || primary === 'LOAN_PAYMENTS';
  const income = primary === 'INCOME';
  const accounting: Accounting = transfer
    ? 'transfer'
    : income && t.amount < 0
      ? 'income'
      : t.amount > 0
        ? 'spend'
        : 'unknown';
  if (transfer)
    return {
      category: 'Transfers',
      categorySource: 'provider',
      confidence: p?.confidence_level ?? 'UNKNOWN',
      accounting,
    };
  if (income)
    return {
      category: 'Income',
      categorySource: 'provider',
      confidence: p?.confidence_level ?? 'UNKNOWN',
      accounting,
    };
  const map: Record<string, Category> = {
    FOOD_AND_DRINK: detailed.includes('GROCER') ? 'Groceries' : 'Dining',
    GENERAL_MERCHANDISE: 'Shopping',
    TRANSPORTATION: 'Transport',
    TRAVEL: 'Transport',
    RENT_AND_UTILITIES: detailed.includes('RENT') ? 'Housing' : 'Utilities',
    MEDICAL: 'Health',
  };
  if (map[primary])
    return {
      category: map[primary],
      categorySource: 'provider',
      confidence: p?.confidence_level ?? 'UNKNOWN',
      accounting,
    };
  // Exact conservative merchant patterns; these affect presentation only.
  const merchant = (t.merchant_name || t.name).trim().toLowerCase();
  const rules: [RegExp, Category][] = [
    [/^(netflix|spotify)(\s|$)/, 'Subscriptions'],
    [/^(whole foods|trader joe)/, 'Groceries'],
  ];
  const rule = rules.find(([pattern]) => pattern.test(merchant));
  return {
    category: rule?.[1] ?? 'Other',
    categorySource: rule ? 'merchant_rule' : 'unclassified',
    confidence: rule ? 'MEDIUM' : 'UNKNOWN',
    accounting,
  };
}

export type AccountFact = {
  date: string;
  merchant: string;
  amountCents: bigint;
  currency: string | null;
  pending: boolean;
  accounting: string;
};
export function observedPatterns(rows: AccountFact[], now = new Date()) {
  const end = now.toISOString().slice(0, 10);
  const currentMonth = end.slice(0, 7);
  const day = now.getUTCDate();
  const priorStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  const priorMonth = priorStart.toISOString().slice(0, 7);
  const previousDays = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0),
  ).getUTCDate();
  const comparableDays = Math.min(day, previousDays);
  const posted = rows.filter(
    (t) =>
      !t.pending &&
      t.currency === 'USD' &&
      t.date <= end &&
      t.accounting === 'spend',
  );
  const merchants = new Map<
    string,
    { merchant: string; currentCents: number; previousCents: number }
  >();
  for (const t of posted) {
    const dateDay = Number(t.date.slice(8, 10));
    if (dateDay > comparableDays) continue;
    const month = t.date.slice(0, 7);
    if (month !== currentMonth && month !== priorMonth) continue;
    const key = t.merchant.toLowerCase().trim();
    const item = merchants.get(key) || {
      merchant: t.merchant,
      currentCents: 0,
      previousCents: 0,
    };
    if (month === currentMonth) item.currentCents += Number(t.amountCents);
    else item.previousCents += Number(t.amountCents);
    merchants.set(key, item);
  }
  const groups = new Map<string, AccountFact[]>();
  for (const t of posted) {
    const key = t.merchant.toLowerCase().trim();
    groups.set(key, [...(groups.get(key) || []), t]);
  }
  const recurring: {
    merchant: string;
    cadence: string;
    estimatedCents: number;
    nextExpectedDate: string;
    confidence: string;
  }[] = [];
  for (const group of groups.values()) {
    const ordered = [...group].sort((a, b) => a.date.localeCompare(b.date));
    if (ordered.length < 3) continue;
    const dates = ordered.map((t) => Date.parse(`${t.date}T00:00:00Z`));
    const gaps = dates.slice(1).map((d, i) => (d - dates[i]) / 86400000);
    const cadence = gaps.every((g) => g >= 6 && g <= 8)
      ? 'weekly'
      : gaps.every((g) => g >= 12 && g <= 16)
        ? 'every two weeks'
        : gaps.every((g) => g >= 26 && g <= 33)
          ? 'monthly'
          : null;
    if (!cadence) continue;
    const amounts = ordered
      .map((t) => Number(t.amountCents))
      .sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    if (
      median <= 0 ||
      amounts.some((a) => Math.abs(a - median) > median * 0.25)
    )
      continue;
    const interval = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
    const next = new Date(dates[dates.length - 1] + interval * 86400000)
      .toISOString()
      .slice(0, 10);
    recurring.push({
      merchant: ordered[0].merchant,
      cadence,
      estimatedCents: median,
      nextExpectedDate: next,
      confidence: 'Observed pattern, not a confirmed bill',
    });
  }
  return {
    merchants: [...merchants.values()]
      .sort((a, b) => b.currentCents - a.currentCents)
      .slice(0, 10),
    recurring,
    comparison: {
      currentMonth,
      priorMonth,
      throughDay: comparableDays,
      coverage:
        'Imported posted USD purchases; a missing prior period is not proof of zero spending.',
    },
  };
}
