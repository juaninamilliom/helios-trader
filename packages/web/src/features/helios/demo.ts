export const institutions = [
  {
    id: "checking",
    name: "Chase",
    type: "Everyday checking",
    last: "4821",
    balance: 4280,
    mark: "C",
    color: "#1755a6",
  },
  {
    id: "savings",
    name: "Chase",
    type: "Savings reserve",
    last: "1038",
    balance: 3200,
    mark: "C",
    color: "#1755a6",
  },
  {
    id: "card",
    name: "American Express",
    type: "Credit card · amount owed",
    last: "2009",
    balance: 680,
    mark: "a",
    color: "#286b80",
  },
  {
    id: "brokerage",
    name: "Robinhood",
    type: "Investments",
    last: "7054",
    balance: 8640,
    mark: "↗",
    color: "#32793d",
  },
] as const;
export type AccountId = (typeof institutions)[number]["id"];
export type Tab = "Today" | "Activity" | "Plan" | "Accounts";
export type Event = {
  id: string;
  title: string;
  detail: string;
  amount?: number;
  kind: "spend" | "income" | "transfer" | "rule";
  time: string;
};
export const transactions: Event[] = [
  {
    id: "t1",
    title: "Amazon",
    detail: "Shopping · Chase debit",
    amount: -84,
    kind: "spend",
    time: "Today",
  },
  {
    id: "t2",
    title: "Whole Foods",
    detail: "Groceries · American Express",
    amount: -62,
    kind: "spend",
    time: "Today",
  },
  {
    id: "t3",
    title: "Paycheck",
    detail: "Income · Chase checking",
    amount: 2600,
    kind: "income",
    time: "Nov 13",
  },
  {
    id: "t4",
    title: "Card repayment",
    detail: "Checking outflow · excluded from spending",
    amount: -450,
    kind: "transfer",
    time: "Nov 12",
  },
  {
    id: "t5",
    title: "Netflix",
    detail: "Recurring · American Express",
    amount: -16,
    kind: "spend",
    time: "Nov 11",
  },
];
export const usd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
export const obligations = 1200 + 680 + 120;
export function eligibility(
  checking: number,
  cushion: number,
  fresh: boolean,
  complete: boolean,
) {
  return fresh && complete ? Math.max(0, checking - obligations - cushion) : 0;
}
