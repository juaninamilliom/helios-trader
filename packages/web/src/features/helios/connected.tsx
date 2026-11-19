"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sun,
  Plus,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  LogOut,
  Landmark,
  Info,
} from "lucide-react";

type Snapshot = {
  patterns: {
    merchants: {
      merchant: string;
      currentCents: number;
      previousCents: number;
    }[];
    recurring: {
      merchant: string;
      cadence: string;
      estimatedCents: number;
      nextExpectedDate: string;
      confidence: string;
    }[];
    comparison: {
      currentMonth: string;
      priorMonth: string;
      throughDay: number;
      coverage: string;
    };
  };
  environment: string;
  connections: {
    id: string;
    institution: string;
    status: string;
    syncedAt: string | null;
    stale: boolean;
  }[];
  accounts: {
    id: string;
    connectionId: string;
    name: string;
    mask: string | null;
    type: string;
    subtype: string | null;
    currency: string | null;
    currentCents: number | null;
    availableCents: number | null;
    balanceAt: string;
  }[];
  transactions: {
    id: string;
    date: string;
    merchant: string;
    amountCents: number;
    currency: string | null;
    pending: boolean;
    category: string;
    categorySource: string;
    confidence: string;
    accounting: string;
    model: string | null;
  }[];
  summary: {
    month: string;
    postedSpendingCents: number;
    confirmedIncomeCents: number;
    categories: Record<string, number>;
    coverage: string;
    truncated: boolean;
  };
  inference: {
    configured: boolean;
    consent: boolean;
    model: string;
    recipient: string;
    classifier: string;
    readiness: string;
  };
};
type PlaidHandler = { open(): void; destroy(): void };
type PlaidClient = {
  create(options: {
    token: string;
    onSuccess(token: string): void;
    onExit(error: { display_message?: string } | null): void;
  }): PlaidHandler;
};
declare global {
  interface Window {
    Plaid?: PlaidClient;
  }
}
const categoryOptions = [
  "Groceries",
  "Dining",
  "Shopping",
  "Transport",
  "Housing",
  "Utilities",
  "Subscriptions",
  "Health",
  "Income",
  "Transfers",
  "Other",
];
async function api<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method: body ? "POST" : "GET",
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.message === "string"
        ? error.message
        : "The backend request failed. Check server configuration and try again.",
    );
  }
  return response.json();
}
function money(cents: number | null, currency: string | null = "USD") {
  return cents === null
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD",
      }).format(cents / 100);
}
function loadPlaid(): Promise<PlaidClient> {
  if (window.Plaid) return Promise.resolve(window.Plaid);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
    script.async = true;
    const timeout = setTimeout(
      () =>
        reject(
          new Error(
            "Plaid Link did not load. Check connectivity and try again.",
          ),
        ),
      15000,
    );
    script.onload = () => {
      clearTimeout(timeout);
      if (window.Plaid) resolve(window.Plaid);
      else reject(new Error("Plaid Link is unavailable"));
    };
    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Could not load Plaid Link. No account was connected."));
    };
    document.head.appendChild(script);
  });
}
export default function ConnectedHelios() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<Snapshot | null>(null);
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [screen, setScreen] = useState("Today");
  const [merchant, setMerchant] = useState("");
  const handler = useRef<PlaidHandler | null>(null);
  const refresh = useCallback(async () => {
    try {
      setError("");
      const [status, capabilities] = await Promise.all([
        api<{ isAuthenticated: boolean; user: { email?: string } | null }>(
          "authentication/status",
        ),
        api<{ plaidConfigured: boolean }>("finance/capabilities"),
      ]);
      setConfigured(capabilities.plaidConfigured);
      setUser(status.isAuthenticated ? status.user : null);
      if (status.isAuthenticated)
        setData(await api<Snapshot>("finance/snapshot"));
      else setData(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backend unavailable");
    } finally {
      setLoaded(true);
    }
  }, []);
  useEffect(() => {
    void refresh();
    return () => handler.current?.destroy();
  }, [refresh]);
  async function action(task: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await task();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  async function link() {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ linkToken: string }>("finance/link-token", {});
      const plaid = await loadPlaid();
      handler.current?.destroy();
      handler.current = plaid.create({
        token: result.linkToken,
        onSuccess: (publicToken) => {
          void action(async () => {
            await api("finance/exchange", { publicToken });
            setNotice(
              "Account connected through Plaid Sandbox. Initial transaction history may still be processing.",
            );
          });
        },
        onExit: (err) => {
          setBusy(false);
          if (err)
            setError(
              err.display_message ||
                "Plaid Link closed with an error. Try again.",
            );
        },
      });
      handler.current.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Link could not open");
      setBusy(false);
    }
  }
  const filtered =
    data?.transactions.filter(
      (t) =>
        !merchant || t.merchant.toLowerCase().includes(merchant.toLowerCase()),
    ) || [];
  return (
    <div className="connected-app">
      <header className="connected-header">
        <Link href="/" className="brand">
          <Sun size={28} />
          helios
        </Link>
        <span className="demo-pill">PLAID SANDBOX · READ ONLY</span>
        <Link href="/demo" className="text-button">
          Explore UI demo
        </Link>
      </header>
      <main className="connected-main">
        {error && (
          <div className="notice error" role="alert">
            <Info size={18} />
            <span>{error}</span>
            <button className="text-button" onClick={() => void refresh()}>
              Retry
            </button>
          </div>
        )}
        {notice && (
          <div className="notice" role="status">
            {notice}
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}
        {!loaded ? (
          <p>Checking your account…</p>
        ) : !user ? (
          <section className="onboarding">
            <div className="sun-art">
              <Sun size={66} strokeWidth={1} />
            </div>
            <div className="eyebrow">YOUR ACCOUNTS. YOUR CONTROL.</div>
            <h1 style={{ marginTop: 20 }}>
              Your money.
              <br />
              <em>One clearer picture.</em>
            </h1>
            <p className="intro">
              Create your Helios account or sign in with Google. Then connect a
              fictional bank through the actual Plaid Sandbox flow.
            </p>
            <a
              className={`button primary wide ${error ? "disabled-link" : ""}`}
              href={error ? "#" : "/api/authentication/google"}
              aria-disabled={!!error}
            >
              Continue with Google <ArrowRight size={17} />
            </a>
            <div className="promise">
              <ShieldCheck size={23} />
              <div>
                <strong>Identity first. Accounts second.</strong>
                <p>
                  Google identifies your Helios workspace. Plaid handles bank
                  authorization. Credentials stay with their providers.
                </p>
              </div>
            </div>
            {!configured && (
              <div className="callout">
                <Info size={18} />
                <p>
                  Plaid credentials have not been configured in the backend yet.
                  Sign-in also needs a running database and Google OAuth
                  configuration.
                </p>
              </div>
            )}
            <p className="fine">
              Sandbox uses fictional data and does not consume your ten
              Production Trial connections. No real transfers or trades are
              available.
            </p>
          </section>
        ) : (
          <>
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  {user.email || "YOUR HELIOS WORKSPACE"}
                </div>
                <h1>Your money, connected.</h1>
                <p>
                  Imported account facts, with their source and uncertainty in
                  view.
                </p>
              </div>
              <button
                className="text-button"
                disabled={busy}
                onClick={() =>
                  void action(async () => {
                    await api("authentication/logout", {});
                  })
                }
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
            <div className="connected-actions">
              <button
                className="button primary"
                disabled={busy || !configured}
                onClick={() => void link()}
              >
                <Plus size={17} />
                {busy ? "Working…" : "Connect with Plaid"}
              </button>
              <button
                className="button secondary"
                disabled={busy || !data?.connections.length}
                onClick={() =>
                  void action(async () => {
                    for (const c of data?.connections || [])
                      await api(`finance/connections/${c.id}/sync`, {});
                    setNotice(
                      "Sync completed. Institution data may still lag actual activity.",
                    );
                  })
                }
              >
                <RefreshCw size={16} />
                Sync accounts
              </button>
            </div>
            {!configured && (
              <div className="callout">
                <Info size={18} />
                <p>
                  Configure the server’s Plaid Sandbox credentials to open Link.
                  No sample accounts will be substituted.
                </p>
              </div>
            )}
            <nav
              className="filter-row connected-tabs"
              aria-label="Workspace navigation"
            >
              {["Today", "Activity", "Accounts", "Intelligence"].map((s) => (
                <button
                  key={s}
                  className={`filter ${screen === s ? "selected" : ""}`}
                  aria-pressed={screen === s}
                  onClick={() => setScreen(s)}
                >
                  {s}
                </button>
              ))}
            </nav>
            {!data ? (
              <div className="card">
                Account data could not be loaded. Retry when the backend is
                available.
              </div>
            ) : (
              <>
                {data.connections.some(
                  (c) => c.stale || c.status !== "connected",
                ) && (
                  <div className="coverage">
                    <Info size={18} />
                    <span>
                      Some account data is stale or needs attention. No money
                      movement is enabled.
                    </span>
                  </div>
                )}
                {!data.accounts.length && (
                  <section className="card empty-state">
                    <Landmark size={32} />
                    <h2>Start with your everyday account.</h2>
                    <p>
                      Connect a Sandbox checking account. Once Plaid’s initial
                      sync finishes, your balances and categorized transactions
                      will appear here.
                    </p>
                  </section>
                )}
                {screen === "Today" && (
                  <>
                    <div className="two-columns">
                      <section className="card">
                        <div className="eyebrow">
                          POSTED SPENDING · {data.summary.month}
                        </div>
                        <h2 className="connected-number">
                          {money(data.summary.postedSpendingCents)}
                        </h2>
                        <p className="fine">
                          Card purchases count here; provider-identified
                          transfers and repayments do not.
                        </p>
                      </section>
                      <section className="card">
                        <div className="eyebrow">
                          IDENTIFIED INCOME · {data.summary.month}
                        </div>
                        <h2 className="connected-number">
                          {money(data.summary.confirmedIncomeCents)}
                        </h2>
                        <p className="fine">
                          Only provider-identified income. Unknown incoming
                          payments are not assumed to be paychecks.
                        </p>
                      </section>
                    </div>
                    <div className="section-title">
                      <h2>Where it’s going</h2>
                      <span>Posted USD purchases</span>
                    </div>
                    <div className="card">
                      {Object.entries(data.summary.categories).length ? (
                        Object.entries(data.summary.categories)
                          .sort((a, b) => b[1] - a[1])
                          .map(([name, value]) => (
                            <div className="category-row" key={name}>
                              <strong>{name}</strong>
                              <div className="reserve-track">
                                <span
                                  style={{
                                    width: `${Math.min(100, (value / Math.max(1, data.summary.postedSpendingCents)) * 100)}%`,
                                  }}
                                />
                              </div>
                              <span>{money(value)}</span>
                            </div>
                          ))
                      ) : (
                        <p className="fine">
                          No posted spending in the imported history for this
                          month yet.
                        </p>
                      )}
                    </div>
                    <div className="section-title">
                      <h2>Merchant rhythms</h2>
                      <span>
                        Comparable windows · days 1–
                        {data.patterns.comparison.throughDay}
                      </span>
                    </div>
                    <div className="card">
                      {data.patterns.merchants.length ? (
                        data.patterns.merchants.map((m) => (
                          <button
                            className="merchant-comparison"
                            key={m.merchant}
                            onClick={() => {
                              setMerchant(m.merchant);
                              setScreen("Activity");
                            }}
                          >
                            <strong>{m.merchant}</strong>
                            <span>{money(m.currentCents)} this period</span>
                            <small>
                              {money(m.previousCents)} in the prior imported
                              period <ArrowRight size={13} />
                            </small>
                          </button>
                        ))
                      ) : (
                        <p className="fine">
                          Not enough imported spending for a comparison yet.
                        </p>
                      )}
                      <p className="fine">
                        {data.patterns.comparison.coverage} A lower spending
                        total is not money available to transfer.
                      </p>
                    </div>
                    <div className="section-title">
                      <h2>Possible recurring payments</h2>
                      <span>Observed, not confirmed</span>
                    </div>
                    <div className="card">
                      {data.patterns.recurring.length ? (
                        data.patterns.recurring.map((r) => (
                          <div className="connection-status" key={r.merchant}>
                            <div>
                              <strong>{r.merchant}</strong>
                              <p>
                                {r.cadence} · next estimate {r.nextExpectedDate}
                              </p>
                              <small>{r.confidence}</small>
                            </div>
                            <strong>~{money(r.estimatedCents)}</strong>
                          </div>
                        ))
                      ) : (
                        <p className="fine">
                          At least three consistent posted payments are needed
                          to infer a rhythm. Nothing is assumed to be a bill
                          from a single purchase.
                        </p>
                      )}
                    </div>
                    <div className="callout">
                      <Info size={18} />
                      <p>
                        {data.summary.coverage}{" "}
                        {data.summary.truncated
                          ? "History exceeds this view’s limit; totals are partial."
                          : ""}{" "}
                        No available-to-invest amount is inferred from this
                        read-only view.
                      </p>
                    </div>
                  </>
                )}
                {screen === "Accounts" && (
                  <>
                    <div className="card connection-list">
                      {data.accounts.map((a) => (
                        <div className="account-row" key={a.id}>
                          <span
                            className="bank-mark"
                            style={{ background: "#667d50" }}
                          >
                            <Landmark size={20} />
                          </span>
                          <div className="grow">
                            <strong>{a.name}</strong>
                            <span>
                              {a.type} · {a.subtype}{" "}
                              {a.mask ? `· ••${a.mask}` : ""}
                            </span>
                            <small>
                              Snapshot fetched{" "}
                              {new Date(a.balanceAt).toLocaleString()}
                            </small>
                          </div>
                          <div className="account-amount">
                            <strong>{money(a.currentCents, a.currency)}</strong>
                            <small>
                              {a.type === "credit"
                                ? "Amount owed"
                                : "Current balance"}
                            </small>
                            {a.availableCents !== null && (
                              <small>
                                Available {money(a.availableCents, a.currency)}
                              </small>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {data.connections.map((c) => (
                      <div className="connection-status" key={c.id}>
                        <div>
                          <strong>{c.institution}</strong>
                          <p>
                            {c.status} ·{" "}
                            {c.syncedAt
                              ? `last sync ${new Date(c.syncedAt).toLocaleString()}`
                              : "Initial history pending"}
                          </p>
                        </div>
                        <button
                          className="text-button danger"
                          disabled={busy}
                          onClick={() =>
                            void action(async () => {
                              await api(
                                `finance/connections/${c.id}/disconnect`,
                                {},
                              );
                              setNotice(
                                "Provider connection revoked and imported data removed.",
                              );
                            })
                          }
                        >
                          Disconnect
                        </button>
                      </div>
                    ))}
                    <p className="fine">
                      Disconnect revokes the Plaid Item and removes its imported
                      accounts and transactions. This integration cannot
                      transfer cash or trade securities.
                    </p>
                  </>
                )}
                {screen === "Activity" && (
                  <>
                    <label className="search-label">
                      Find a merchant
                      <input
                        placeholder="Search imported activity"
                        value={merchant}
                        onChange={(e) => setMerchant(e.target.value)}
                      />
                    </label>
                    <div className="card activity-list">
                      {filtered.length ? (
                        filtered.slice(0, 200).map((t) => (
                          <article className="activity-row" key={t.id}>
                            <div className="grow">
                              <strong>{t.merchant}</strong>
                              <span>
                                {t.date} · {t.pending ? "Pending" : "Posted"} ·{" "}
                                {t.accounting}
                              </span>
                              <small>
                                {t.categorySource} · confidence {t.confidence}
                                {t.model ? ` · ${t.model}` : ""}
                              </small>
                              <label className="category-edit">
                                Category
                                <select
                                  aria-label={`Category for ${t.merchant} on ${t.date}`}
                                  value={t.category}
                                  disabled={busy}
                                  onChange={(e) =>
                                    void action(async () => {
                                      await api(
                                        `finance/transactions/${t.id}/category`,
                                        { category: e.target.value },
                                      );
                                    })
                                  }
                                >
                                  {categoryOptions.map((c) => (
                                    <option key={c}>{c}</option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <strong>{money(-t.amountCents, t.currency)}</strong>
                          </article>
                        ))
                      ) : (
                        <p className="fine" style={{ padding: 20 }}>
                          No matching transactions in the imported history.
                        </p>
                      )}
                    </div>
                    {filtered.length > 200 && (
                      <p className="fine">
                        Showing 200 matches. Narrow your merchant search for
                        more specific results.
                      </p>
                    )}
                    <p className="fine">
                      Changing a category edits presentation only. It never
                      changes transfer/income accounting. Negative spending
                      credits remain unclassified rather than being assumed to
                      be income.
                    </p>
                  </>
                )}
                {screen === "Intelligence" && (
                  <section className="card intelligence">
                    <div className="eyebrow">
                      RULES FIRST. EXPLANATIONS SECOND.
                    </div>
                    <h2>Know where a label came from.</h2>
                    <p>
                      Provider categories are applied first. Conservative
                      merchant rules fill known gaps. Your corrections take
                      priority. Uncertain purchases can optionally receive model
                      suggestions.
                    </p>
                    <div className="subtle-box">
                      <strong>Minimal-data AI classification</strong>
                      <p>
                        With your permission, the server sends{" "}
                        {data.inference.recipient} a shortened merchant
                        description with digits removed. It does not send your
                        name, account details, amounts or transaction dates.
                        Merchant text may still reveal purchase context.
                        Suggestions are validated and never control calculations
                        or transfers.
                      </p>
                      <p>
                        Configured classifier: {data.inference.classifier} ·{" "}
                        {data.inference.model}. {data.inference.readiness}. This
                        initial candidate has not been accuracy-qualified for
                        real financial data.
                      </p>
                    </div>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={data.inference.consent}
                        disabled={busy}
                        onChange={(e) =>
                          void action(async () => {
                            await api("finance/ai-consent", {
                              consent: e.target.checked,
                            });
                          })
                        }
                      />
                      Allow {data.inference.recipient} to receive minimized
                      merchant descriptions for optional category suggestions. I
                      can turn this off at any time; previous requests cannot be
                      recalled.
                    </label>
                    <button
                      className="button primary"
                      style={{ marginTop: 20 }}
                      disabled={
                        busy ||
                        !data.inference.consent ||
                        !data.inference.configured
                      }
                      onClick={() =>
                        void action(async () => {
                          const result = await api<{ message: string }>(
                            "finance/classify",
                            {},
                          );
                          setNotice(result.message);
                        })
                      }
                    >
                      Classify uncertain purchases
                    </button>
                    {!data.inference.configured && (
                      <p className="fine">
                        The selected AI provider is not configured. Provider
                        categories and merchant rules continue to work.
                      </p>
                    )}
                    <p className="fine">
                      Up to 20 uncertain purchases per request. Refusals,
                      timeouts and invalid responses leave the category
                      unchanged. This control does not authorize money movement.
                    </p>
                  </section>
                )}
              </>
            )}
            <footer>
              <Sun size={16} />
              <span>Your accounts stay where they are.</span>
              <span>Sandbox integration · money movement unavailable</span>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
