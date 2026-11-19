import {
  classify,
  minorUnits,
  observedPatterns,
  type ProviderTransaction,
} from './domain';
const txn = (
  primary: string,
  amount: number,
  detailed = primary,
): ProviderTransaction => ({
  transaction_id: 'x',
  account_id: 'a',
  amount,
  iso_currency_code: 'USD',
  date: '2026-11-10',
  name: 'Example',
  pending: false,
  personal_finance_category: { primary, detailed, confidence_level: 'HIGH' },
});
describe('reviewed finance invariants', () => {
  it('separates purchases, repayment and ambiguous credits', () => {
    expect(classify(txn('FOOD_AND_DRINK', 50)).accounting).toBe('spend');
    expect(classify(txn('LOAN_PAYMENTS', 50)).accounting).toBe('transfer');
    expect(classify(txn('', -50)).accounting).toBe('unknown');
    expect(classify(txn('INCOME', -2000)).accounting).toBe('income');
  });
  it('uses provider detail to distinguish groceries', () =>
    expect(
      classify(txn('FOOD_AND_DRINK', 50, 'FOOD_AND_DRINK_GROCERIES')).category,
    ).toBe('Groceries'));
  it('uses bounded integer minor units', () => {
    expect(minorUnits(1.005)).toBe(101);
    expect(minorUnits(-1.005)).toBe(-101);
    expect(() => minorUnits(Infinity)).toThrow();
    expect(() => minorUnits(1e20)).toThrow();
  });
  it('does not claim recurrence for one or two purchases', () => {
    const row = {
      merchant: 'Example',
      amountCents: 1000n,
      currency: 'USD',
      pending: false,
      accounting: 'spend',
      date: '2026-11-01',
    };
    expect(
      observedPatterns([row], new Date('2026-11-17T00:00:00Z')).recurring,
    ).toHaveLength(0);
  });
  it('marks a stable three-month pattern as uncertain and excludes pending/transfers', () => {
    const rows = ['2026-09-01', '2026-10-01', '2026-11-01'].map((date) => ({
      date,
      merchant: 'Example',
      amountCents: 1000n,
      currency: 'USD',
      pending: false,
      accounting: 'spend',
    }));
    const facts = observedPatterns(
      [
        ...rows,
        { ...rows[2], pending: true, amountCents: 9000n },
        { ...rows[2], accounting: 'transfer', amountCents: 9000n },
      ],
      new Date('2026-11-17T00:00:00Z'),
    );
    expect(facts.recurring).toHaveLength(1);
    expect(facts.recurring[0].confidence).toContain('not a confirmed bill');
    expect(facts.merchants[0].currentCents).toBe(1000);
  });
});
