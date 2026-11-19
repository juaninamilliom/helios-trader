"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  ChevronRight,
  Check,
  Plus,
  X,
  Sun,
  LayoutDashboard,
  List,
  SlidersHorizontal,
  Wallet,
  ShieldCheck,
  Pause,
  Play,
  RefreshCw,
  Landmark,
  Info,
} from "lucide-react";
import {
  institutions,
  transactions,
  usd,
  eligibility,
  type AccountId,
  type Tab,
  type Event,
} from "./demo";

type DemoState = {
  connected: AccountId[];
  onboarded: boolean;
  cushion: number;
  target: number;
  limit: number;
  consent: boolean;
  paused: boolean;
  fresh: boolean;
  checking: number;
  savings: number;
  brokerageCash: number;
  invested: number;
  events: Event[];
};
const initial: DemoState = {
  connected: [],
  onboarded: false,
  cushion: 1500,
  target: 5000,
  limit: 200,
  consent: false,
  paused: false,
  fresh: true,
  checking: 4280,
  savings: 3200,
  brokerageCash: 240,
  invested: 0,
  events: [],
};
const tabs: Tab[] = ["Today", "Activity", "Plan", "Accounts"];
const icons = [LayoutDashboard, List, SlidersHorizontal, Wallet];

export default function Helios() {
  const [state, setState] = useState<DemoState>(initial);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("Today");
  const [step, setStep] = useState(0);
  const [linking, setLinking] = useState<AccountId | null>(null);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<
    "merchant" | "withdraw" | "consent" | "flow" | null
  >(null);
  const [amount, setAmount] = useState(100);
  const [reduction, setReduction] = useState(false);
  const [filter, setFilter] = useState("All");
  const [consentCheck, setConsentCheck] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("helios-demo-v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed.connected) &&
          typeof parsed.checking === "number"
        )
          setState({ ...initial, ...parsed });
      }
    } catch {
      /* A blocked browser store leaves a usable in-memory demo. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem("helios-demo-v1", JSON.stringify(state));
      } catch {
        /* Demo remains usable without persistence. */
      }
    }
  }, [state, ready]);
  useEffect(() => {
    if (!modal) return;
    const dismiss = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [modal]);
  const update = (patch: Partial<DemoState>) =>
    setState((s) => ({ ...s, ...patch }));
  const complete = ["checking", "savings", "card", "brokerage"].every((id) =>
    state.connected.includes(id as AccountId),
  );
  const eligible = eligibility(
    state.checking,
    state.cushion,
    state.fresh,
    complete,
  );
  const reserveGap = Math.max(0, state.target - state.savings);
  const event = (title: string, detail: string, value?: number) => ({
    id: `${Date.now()}-${Math.random()}`,
    title,
    detail,
    amount: value,
    kind: "rule" as const,
    time: "Just now",
  });
  function connect(id: AccountId) {
    setLinking(id);
    setFailed(false);
  }
  function finishLink() {
    if (!linking) return;
    update({ connected: [...new Set([...state.connected, linking])] });
    setNotice(
      `${institutions.find((a) => a.id === linking)?.type} added with sample data.`,
    );
    setLinking(null);
  }
  function runRule() {
    if (!state.consent || state.paused || eligible <= 0) return;
    const transfer = Math.min(eligible, state.limit, reserveGap);
    if (transfer > 0) {
      setState((s) => ({
        ...s,
        checking: s.checking - transfer,
        savings: s.savings + transfer,
        events: [
          event(
            "Reserve replenished",
            "Simulated · confirmed immediately for this demo. No real money moved.",
            transfer,
          ),
          ...s.events,
        ],
      }));
      setNotice(`${usd(transfer)} simulated into your savings reserve.`);
    } else {
      const invest = Math.min(eligible, state.limit);
      setState((s) => ({
        ...s,
        checking: s.checking - invest,
        invested: s.invested + invest,
        events: [
          event(
            "ETF purchase simulated",
            `${usd(invest)} simulated toward a broad-market ETF. Execution and funding are unverified.`,
            invest,
          ),
          ...s.events,
        ],
      }));
      setNotice("Investment allocation simulated. No real order placed.");
    }
  }
  const balance = (id: AccountId) =>
    id === "checking"
      ? state.checking
      : id === "savings"
        ? state.savings
        : id === "brokerage"
          ? 8400 + state.brokerageCash + state.invested
          : institutions.find((a) => a.id === id)!.balance;
  function accountRows(onboarding = false) {
    return institutions.map((a) => (
      <div className="account-row" key={a.id}>
        <span className="bank-mark" style={{ background: a.color }}>
          {a.mark}
        </span>
        <div className="grow">
          <strong>{a.name}</strong>
          <span>
            {a.type}
            {state.connected.includes(a.id) ? ` · ••${a.last}` : ""}
          </span>
        </div>
        {state.connected.includes(a.id) ? (
          onboarding ? (
            <span className="connected">
              <Check size={15} /> Added
            </span>
          ) : (
            <div className="account-amount">
              <strong>{usd(balance(a.id))}</strong>
              <button
                className="text-button small"
                onClick={() => {
                  update({
                    connected: state.connected.filter((id) => id !== a.id),
                    paused: true,
                  });
                  setNotice(
                    "Demo account disconnected. Automation paused because coverage changed.",
                  );
                }}
              >
                Disconnect
              </button>
            </div>
          )
        ) : (
          <button
            className="button secondary compact"
            onClick={() => connect(a.id)}
          >
            <Plus size={15} /> Add sample
          </button>
        )}
      </div>
    ));
  }
  if (!ready)
    return (
      <main className="loading">
        <Sun size={34} /> Opening Helios…
      </main>
    );
  return (
    <div className="app">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="Helios home">
          <Sun size={29} strokeWidth={1.7} /> helios<span>®</span>
        </Link>
        <div className="sidebar-label">A LITTLE MORE CLARITY</div>
        <nav aria-label="Main navigation">
          {tabs.map((name, i) => {
            const Icon = icons[i];
            return (
              <button
                key={name}
                className={`nav-item ${tab === name ? "active" : ""}`}
                onClick={() => {
                  if (!state.onboarded) {
                    setNotice(
                      "Connect sample checking to open your money picture.",
                    );
                    return;
                  }
                  setTab(name);
                }}
              >
                <Icon size={20} />
                {name}
                {name === "Today" && <span className="nav-dot" />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <span className="demo-dot" /> Interactive demo
          <p>Your real accounts stay right where they are.</p>
          <div className="profile">
            <span>JD</span>
            <div>
              Jamie Davis<small>Personal workspace</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <span className="mobile-brand">
            <Sun size={22} /> helios
          </span>
          <span className="breadcrumb">Your money, a little clearer.</span>
          <span className="demo-pill">SAMPLE DATA · NO REAL MONEY</span>
          <span className="avatar">JD</span>
        </header>
        <main className="main-content">
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {!state.onboarded ? (
            <div className="onboarding">
              <div className="eyebrow">
                WELCOME TO HELIOS <span>0{step + 1} / 03</span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${((step + 1) / 3) * 100}%` }} />
              </div>
              {step === 0 ? (
                <>
                  <div className="sun-art">
                    <Sun size={72} strokeWidth={1} />
                  </div>
                  <h1>
                    Make room for
                    <br />
                    <em>a little more life.</em>
                  </h1>
                  <p className="intro">
                    Your money is in a few places. Bring the picture together,
                    and find a little breathing room.
                  </p>
                  <div className="promise">
                    <ShieldCheck size={22} />
                    <div>
                      <strong>Your accounts. Your control.</strong>
                      <p>
                        Helios organizes what you already use. Your bank,
                        savings and investments stay in their own apps.
                      </p>
                    </div>
                  </div>
                  <button
                    className="button primary wide"
                    onClick={() => setStep(1)}
                  >
                    Let’s bring it together <ArrowRight size={18} />
                  </button>
                  <p className="fine">
                    Explore with sample accounts. No passwords, provider access
                    or real money movement.
                  </p>
                </>
              ) : step === 1 ? (
                <>
                  <h1>
                    Start with the account
                    <br />
                    life happens in.
                  </h1>
                  <p className="intro">
                    Add sample checking first. Then add savings, cards and
                    investments for a fuller picture. No budget to build.
                  </p>
                  <div className="connection-list">{accountRows(true)}</div>
                  <div className="callout">
                    <Info size={18} />
                    <p>
                      In a connected product, you would authorize account access
                      with a provider. These buttons only add fictional data.
                    </p>
                  </div>
                  <div className="button-pair">
                    <button
                      className="button secondary"
                      onClick={() => setStep(0)}
                    >
                      Back
                    </button>
                    <button
                      className="button primary"
                      disabled={!state.connected.includes("checking")}
                      onClick={() => setStep(2)}
                    >
                      See my picture <ArrowRight size={17} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="round-icon">
                    <Check size={26} />
                  </span>
                  <h1>
                    A clearer picture.
                    <br />
                    <em>A calmer next step.</em>
                  </h1>
                  <p className="intro">
                    {state.connected.length} sample account
                    {state.connected.length === 1 ? "" : "s"} added. Start with
                    what’s happening today; your plan can come later.
                  </p>
                  <div className="preview-stat">
                    <span>In your checking</span>
                    <strong>{usd(state.checking)}</strong>
                    <small>
                      Fictional balance · refreshed now in this demo
                    </small>
                  </div>
                  <div className="callout">
                    <Info size={18} />
                    <p>
                      {complete
                        ? "Your sample coverage includes checking, savings, cards and investments."
                        : "Your picture is partial. Add the remaining sample accounts later; automation stays unavailable until coverage is complete."}
                    </p>
                  </div>
                  <div className="button-pair">
                    <button
                      className="button secondary"
                      onClick={() => setStep(1)}
                    >
                      Back
                    </button>
                    <button
                      className="button primary"
                      onClick={() => update({ onboarded: true })}
                    >
                      Go to Today <ArrowRight size={17} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    TUESDAY, NOVEMBER 17 · DEMO SCENARIO
                  </div>
                  <h1>
                    {tab === "Today"
                      ? "Good morning, Jamie."
                      : tab === "Activity"
                        ? "The little things add up."
                        : tab === "Plan"
                          ? "Today, meet tomorrow."
                          : "Your money lives here."}
                  </h1>
                  <p>
                    {tab === "Today"
                      ? "Here’s where you stand. And where you have room."
                      : tab === "Activity"
                        ? "A clear trail of what happened, and why."
                        : tab === "Plan"
                          ? "Protect your everyday. Build a reserve. Grow from there."
                          : "A shared picture of the accounts you already use."}
                  </p>
                </div>
                <button
                  className="freshness"
                  onClick={() => {
                    update({ fresh: true });
                    setNotice(
                      "Sample snapshot marked fresh. No provider was contacted.",
                    );
                  }}
                >
                  <RefreshCw size={13} />
                  {state.fresh
                    ? "Sample snapshot · fresh"
                    : "Data stale · actions paused"}
                </button>
              </div>
              {!complete && (
                <div className="coverage">
                  <Info size={18} />
                  <span>
                    Your picture is partial. Missing accounts can change the
                    forecast.
                  </span>
                  <button
                    className="text-button"
                    onClick={() => setTab("Accounts")}
                  >
                    Add accounts <ArrowRight size={14} />
                  </button>
                </div>
              )}
              {tab === "Today" && (
                <>
                  <div className="today-grid">
                    <section className="hero-card">
                      <div className="eyebrow">
                        IN YOUR CHECKING <span>Chase · ••4821</span>
                      </div>
                      <div className="hero-number">
                        {state.connected.includes("checking")
                          ? usd(state.checking)
                          : "—"}
                        <span>
                          {state.connected.includes("checking") ? ".00" : ""}
                        </span>
                      </div>
                      <p className="hero-caption">
                        For the everyday, and a little beyond.
                      </p>
                      <div
                        className="cash-chart"
                        aria-label="Illustrative checking balance trend, not a forecast"
                      >
                        <svg
                          viewBox="0 0 600 100"
                          preserveAspectRatio="none"
                          role="img"
                        >
                          <title>Illustrative sample checking trend</title>
                          <defs>
                            <linearGradient
                              id="fade"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#8a9c70"
                                stopOpacity=".22"
                              />
                              <stop
                                offset="100%"
                                stopColor="#8a9c70"
                                stopOpacity="0"
                              />
                            </linearGradient>
                          </defs>
                          <path
                            d="M0 82 L40 74 L80 80 L120 59 L160 63 L200 44 L240 53 L280 37 L320 40 L360 25 L400 32 L440 18 L480 24 L520 9 L560 16 L600 8 L600 100 L0 100Z"
                            fill="url(#fade)"
                          />
                          <path
                            d="M0 82 L40 74 L80 80 L120 59 L160 63 L200 44 L240 53 L280 37 L320 40 L360 25 L400 32 L440 18 L480 24 L520 9 L560 16 L600 8"
                            fill="none"
                            stroke="#63814c"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                      <div className="chart-labels">
                        <span>OCT 18</span>
                        <span>Illustrative · last 30 days</span>
                        <span>NOV 17</span>
                      </div>
                      <div className="hero-bottom">
                        <span>Next expected payday</span>
                        <strong>
                          Nov 27 <span>· ~{usd(2600)}</span>
                        </strong>
                      </div>
                    </section>
                    <section className="card breathing">
                      <div className="eyebrow">
                        A LITTLE BREATHING ROOM <Sun size={18} />
                      </div>
                      <h2>
                        {complete && state.fresh
                          ? usd(eligible)
                          : "Still coming into focus"}
                      </h2>
                      <p>
                        {complete && state.fresh
                          ? "Estimated room after upcoming bills and your checking cushion."
                          : "We need complete, fresh coverage before estimating money eligible to move."}
                      </p>
                      <div className="breakdown">
                        <div>
                          <span>Checking balance</span>
                          <strong>{usd(state.checking)}</strong>
                        </div>
                        <div>
                          <span>Expected outflows</span>
                          <span>−{usd(2000)}</span>
                        </div>
                        <div>
                          <span>Your checking cushion</span>
                          <span>−{usd(state.cushion)}</span>
                        </div>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setModal("flow")}
                      >
                        How we got here <ArrowRight size={15} />
                      </button>
                      <small>
                        Estimate, not a guarantee. Future income isn’t available
                        cash.
                      </small>
                    </section>
                  </div>
                  <div className="section-title">
                    <h2>A few things worth a look</h2>
                    <span>No homework. Just clarity.</span>
                  </div>
                  <div className="insight-grid">
                    <button
                      className="card insight merchant"
                      onClick={() => setModal("merchant")}
                    >
                      <div className="insight-top">
                        <span className="merchant-mark">
                          a<span>⌣</span>
                        </span>
                        <span className="tag">SPENDING RHYTHM</span>
                        <ArrowUpRight size={20} />
                      </div>
                      <h3>A little more on Amazon.</h3>
                      <p>
                        {state.connected.includes("card")
                          ? "Your sample month-to-date spending is $600, compared with $400 over the same prior-month window."
                          : "Add your card to see this sample merchant pattern across accounts."}
                      </p>
                      <div className="insight-bottom">
                        <strong>
                          {reduction
                            ? "Change chosen · observe next"
                            : "+$200 versus your usual"}
                        </strong>
                        <ChevronRight size={17} />
                      </div>
                    </button>
                    <section className="card insight reserve">
                      <div className="insight-top">
                        <span className="round-icon small-round">
                          <ShieldCheck size={20} />
                        </span>
                        <span className="tag">YOUR SAFETY NET</span>
                      </div>
                      <h3>
                        {state.connected.includes("savings")
                          ? `${usd(state.savings)} of calm.`
                          : "Give your reserve a home."}
                      </h3>
                      <p>
                        {state.connected.includes("savings")
                          ? `Your sample savings reserve is ${Math.round((state.savings / state.target) * 100)}% of the way to your ${usd(state.target)} target.`
                          : "Add savings to see your cash reserve separately from investments."}
                      </p>
                      <div className="reserve-track">
                        <span
                          style={{
                            width: `${state.connected.includes("savings") ? Math.min(100, (state.savings / state.target) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setTab("Plan")}
                      >
                        A plan at your pace <ArrowRight size={15} />
                      </button>
                    </section>
                  </div>
                  <div className="section-title">
                    <h2>Before your next payday</h2>
                    <button
                      className="text-button"
                      onClick={() => setModal("flow")}
                    >
                      See the forecast <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="card bill-list">
                    {[
                      ["20", "Rent", "Expected · checking", "$1,200"],
                      [
                        "23",
                        "American Express",
                        "Card payment · checking outflow",
                        "$680",
                      ],
                      [
                        "25",
                        "Utilities",
                        "Estimated · amount may change",
                        "~$120",
                      ],
                    ].map((row) => (
                      <div className="bill" key={row[0]}>
                        <div className="date-tile">
                          <small>NOV</small>
                          {row[0]}
                        </div>
                        <div className="grow">
                          <strong>{row[1]}</strong>
                          <span>{row[2]}</span>
                        </div>
                        <strong>{row[3]}</strong>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {tab === "Activity" && (
                <>
                  <div className="filter-row" aria-label="Filter activity">
                    {[
                      "All",
                      "Spending",
                      "Income",
                      "Transfers",
                      "Automation",
                    ].map((f) => (
                      <button
                        key={f}
                        aria-pressed={filter === f}
                        className={`filter ${filter === f ? "selected" : ""}`}
                        onClick={() => setFilter(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <div className="card activity-list">
                    {[
                      ...state.events,
                      ...transactions.filter(
                        (t) =>
                          t.id !== "t2" || state.connected.includes("card"),
                      ),
                    ]
                      .filter(
                        (t) =>
                          filter === "All" ||
                          t.kind ===
                            (
                              {
                                Spending: "spend",
                                Income: "income",
                                Transfers: "transfer",
                                Automation: "rule",
                              } as Record<string, string>
                            )[filter],
                      )
                      .map((t) => (
                        <div className="activity-row" key={t.id}>
                          <span
                            className={`transaction-icon ${t.kind === "income" ? "green" : ""}`}
                          >
                            {t.kind === "income" ? (
                              <ArrowDownLeft size={20} />
                            ) : t.kind === "rule" ? (
                              <SlidersHorizontal size={18} />
                            ) : (
                              <ArrowUpRight size={20} />
                            )}
                          </span>
                          <div className="grow">
                            <strong>{t.title}</strong>
                            <span>{t.detail}</span>
                            <small>{t.time} · sample data</small>
                          </div>
                          {t.amount !== undefined && (
                            <strong
                              className={t.kind === "income" ? "positive" : ""}
                            >
                              {t.amount > 0 && t.kind === "income" ? "+" : ""}
                              {usd(t.amount)}
                            </strong>
                          )}
                        </div>
                      ))}
                  </div>
                  <p className="footnote">
                    Card purchases count as spending. Repayments appear as
                    transfers so they aren’t counted twice. Sample rows
                    illustrate activity; they are not a complete statement for
                    the balance above.
                  </p>
                </>
              )}
              {tab === "Plan" && (
                <>
                  <div className="plan-layout">
                    <section className="card plan-card">
                      <div className="eyebrow">
                        YOUR MONEY, WITH A DIRECTION <ShieldCheck size={18} />
                      </div>
                      <h2>Small steps. In the right order.</h2>
                      <div className="plan-step">
                        <span>1</span>
                        <div>
                          <h3>Protect the everyday</h3>
                          <p>Keep bills covered and a cushion in checking.</p>
                          <label>
                            Checking cushion{" "}
                            <div className="money-input">
                              <span>$</span>
                              <input
                                aria-label="Checking cushion"
                                type="number"
                                min="0"
                                max="1000000"
                                value={state.cushion}
                                onChange={(e) =>
                                  update({
                                    cushion: Math.max(
                                      0,
                                      Number(e.target.value),
                                    ),
                                    consent: false,
                                    paused: true,
                                  })
                                }
                              />
                            </div>
                          </label>
                        </div>
                      </div>
                      <div className="plan-step">
                        <span>2</span>
                        <div>
                          <h3>Build your breathing room</h3>
                          <p>
                            Eligible surplus goes to your existing savings
                            first.
                          </p>
                          <label>
                            Cash reserve target{" "}
                            <div className="money-input">
                              <span>$</span>
                              <input
                                aria-label="Reserve target"
                                type="number"
                                min="1"
                                value={state.target}
                                onChange={(e) =>
                                  update({
                                    target: Math.max(1, Number(e.target.value)),
                                    consent: false,
                                    paused: true,
                                  })
                                }
                              />
                            </div>
                          </label>
                          <small>
                            {usd(state.savings)} in sample savings ·{" "}
                            {usd(reserveGap)} to go
                          </small>
                        </div>
                      </div>
                      <div className="plan-step">
                        <span>3</span>
                        <div>
                          <h3>Then, make room to grow</h3>
                          <p>
                            After the reserve is funded, eligible surplus can be
                            allocated to stocks and ETFs at your existing
                            brokerage. No crypto.
                          </p>
                          <div className="subtle-box">
                            Preview allocation: broad-market ETF
                            <br />
                            <small>
                              No security or order is authorized in this demo.
                            </small>
                          </div>
                        </div>
                      </div>
                      <label className="limit-label">
                        Maximum per simulated run
                        <div className="money-input">
                          <span>$</span>
                          <input
                            aria-label="Automation limit"
                            type="number"
                            min="1"
                            max="10000"
                            value={state.limit}
                            onChange={(e) =>
                              update({
                                limit: Math.max(
                                  1,
                                  Math.min(10000, Number(e.target.value)),
                                ),
                                consent: false,
                                paused: true,
                              })
                            }
                          />
                        </div>
                      </label>
                      <div className="callout">
                        <Info size={18} />
                        <p>
                          If the reserve or cash flow weakens, investing stops.
                          Stale data stops all movement. No automatic sale of
                          investments.
                        </p>
                      </div>
                      <button
                        className="button primary wide"
                        onClick={() => {
                          setConsentCheck(false);
                          setModal("consent");
                        }}
                      >
                        Review demo authorization <ArrowRight size={17} />
                      </button>
                    </section>
                    <div>
                      <section className="card rule-status">
                        <div className="eyebrow">AUTOMATION STATUS</div>
                        <span
                          className={`status-label ${state.consent && !state.paused && state.fresh && complete ? "enabled" : ""}`}
                        >
                          {!state.consent
                            ? "Not authorized"
                            : state.paused || !state.fresh || !complete
                              ? "Paused"
                              : "Demo rule active"}
                        </span>
                        <p>
                          Ongoing rules can act within your preauthorized
                          limits. In this prototype, use a simulated run to
                          observe the cycle.
                        </p>
                        <button
                          className="button secondary wide"
                          disabled={!state.consent}
                          onClick={() => {
                            update({ paused: !state.paused });
                            setNotice(
                              state.paused
                                ? "Demo rule resumed. Eligibility is still checked on every run."
                                : "Demo rule paused. No new actions will start.",
                            );
                          }}
                        >
                          {state.paused ? (
                            <Play size={16} />
                          ) : (
                            <Pause size={16} />
                          )}
                          {state.paused ? "Resume rule" : "Pause rule"}
                        </button>
                        <button
                          className="button primary wide"
                          disabled={
                            !state.consent || state.paused || eligible <= 0
                          }
                          onClick={runRule}
                        >
                          Simulate next run <ArrowRight size={16} />
                        </button>
                        {state.consent && (
                          <button
                            className="text-button danger"
                            onClick={() => {
                              update({
                                consent: false,
                                paused: true,
                                events: [
                                  event(
                                    "Authorization revoked",
                                    "Demo rule disabled. No new actions may start.",
                                  ),
                                  ...state.events,
                                ],
                              });
                            }}
                          >
                            Revoke authorization
                          </button>
                        )}
                        <small>
                          Eligible now: {usd(eligible)} ·{" "}
                          {reserveGap > 0
                            ? "Savings comes first"
                            : "Reserve target reached"}
                        </small>
                      </section>
                      <section className="card note-card">
                        <h3>You’re still in control.</h3>
                        <p>
                          A pause blocks new actions. An already submitted real
                          transfer could still settle. Provider-confirmed
                          activity would appear in your bank or brokerage app
                          too.
                        </p>
                      </section>
                    </div>
                  </div>
                </>
              )}
              {tab === "Accounts" && (
                <>
                  <div className="card connection-list">{accountRows()}</div>
                  <div className="account-tools">
                    <button
                      className="button secondary"
                      disabled={!state.connected.includes("brokerage")}
                      onClick={() => {
                        setAmount(100);
                        setModal("withdraw");
                      }}
                    >
                      <ArrowDownLeft size={17} /> Withdraw to bank
                    </button>
                    <button
                      className="text-button"
                      onClick={() => {
                        update({ fresh: !state.fresh });
                        setNotice(
                          state.fresh
                            ? "Stale-data scenario enabled. All simulated money actions are blocked."
                            : "Sample data marked fresh again. No real sync occurred.",
                        );
                      }}
                    >
                      {state.fresh
                        ? "Try stale-data scenario"
                        : "Restore fresh sample data"}
                    </button>
                  </div>
                  <div className="two-columns">
                    <section className="card note-card">
                      <Landmark size={24} />
                      <h3>Same accounts. Clearer picture.</h3>
                      <p>
                        Your balances and completed actions should still appear
                        in your institutions’ own apps. Helios is an organizing
                        layer over those accounts.
                      </p>
                    </section>
                    <section className="card note-card">
                      <ShieldCheck size={24} />
                      <h3>Reads aren’t transfers.</h3>
                      <p>
                        No institution is connected here. Funding existing
                        Robinhood accounts and bank-to-savings automation remain
                        provider feasibility gates.
                      </p>
                    </section>
                  </div>
                  <button
                    className="text-button danger reset"
                    onClick={() => {
                      setState(initial);
                      setStep(0);
                      setTab("Today");
                      setNotice(
                        "Demo reset. Start again with sample connections.",
                      );
                    }}
                  >
                    Reset sample workspace
                  </button>
                </>
              )}
              <footer>
                <Sun size={15} />
                <span>A little clarity goes a long way.</span>
                <span>Helios prototype · fictional scenario</span>
              </footer>
            </>
          )}
        </main>
      </div>
      {state.onboarded && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {tabs.map((name, i) => {
            const Icon = icons[i];
            return (
              <button
                key={name}
                className={tab === name ? "active" : ""}
                onClick={() => setTab(name)}
              >
                <Icon size={21} />
                <span>{name}</span>
              </button>
            );
          })}
        </nav>
      )}
      {(linking || modal) && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setModal(null);
            setLinking(null);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            ref={(node) => {
              if (node && !node.contains(document.activeElement)) node.focus();
            }}
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setLinking(null);
                setModal(null);
              }
              if (e.key === "Tab") {
                const items = e.currentTarget.querySelectorAll<HTMLElement>(
                  "button:not(:disabled), input:not(:disabled), [href]",
                );
                const first = items[0],
                  last = items[items.length - 1];
                if (
                  e.shiftKey &&
                  (document.activeElement === first ||
                    document.activeElement === e.currentTarget)
                ) {
                  e.preventDefault();
                  last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first?.focus();
                }
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal"
              aria-label="Close dialog"
              onClick={() => {
                setModal(null);
                setLinking(null);
              }}
            >
              <X size={21} />
            </button>
            {linking ? (
              <>
                <div className="eyebrow">SIMULATED CONNECTION</div>
                <h2 id="dialog-title">
                  {failed
                    ? "A small detour."
                    : `Add ${institutions.find((a) => a.id === linking)?.type.toLowerCase()}`}
                </h2>
                <p>
                  {failed
                    ? "The sample institution is unavailable. Your other accounts are unchanged. Try again or come back later."
                    : "This adds fictional balances and transactions. No login, credentials or real institution access is involved."}
                </p>
                <div className="subtle-box">
                  Sample access: balances, transactions and account details.
                  <br />
                  Money movement: not connected.
                </div>
                <button
                  className="button primary wide"
                  onClick={failed ? () => setFailed(false) : finishLink}
                >
                  {failed ? "Try again" : "Add sample account"}
                  <ArrowRight size={17} />
                </button>
                <button
                  className="text-button"
                  onClick={() => (failed ? setLinking(null) : setFailed(true))}
                >
                  {failed ? "Come back later" : "Try a connection error"}
                </button>
              </>
            ) : modal === "merchant" ? (
              <>
                <div className="eyebrow">A PATTERN, NOT A JUDGMENT</div>
                <h2 id="dialog-title">A closer look at Amazon.</h2>
                <p>
                  Sample spending, November 1–17 versus October 1–17. Purchases
                  across debit and credit cards; repayments excluded.
                </p>
                <div className="comparison">
                  <div>
                    <span>This period</span>
                    <strong>$600</strong>
                    <i style={{ width: "100%" }} />
                  </div>
                  <div>
                    <span>Previous period</span>
                    <strong>$400</strong>
                    <i style={{ width: "67%" }} />
                  </div>
                </div>
                <div className="subtle-box">
                  <strong>Try $100 less next month?</strong>
                  <p>
                    That’s a potential change, not cash you have today. We’ll
                    compare actual spending over the next full window. It won’t
                    increase your transfer allowance.
                  </p>
                </div>
                <button
                  className="button primary wide"
                  disabled={!state.connected.includes("card")}
                  onClick={() => {
                    setReduction(true);
                    update({
                      events: [
                        event(
                          "Spending change chosen",
                          "Aim for $100 less at Amazon next month. Potential savings only; no cash eligibility change.",
                        ),
                        ...state.events,
                      ],
                    });
                    setNotice(
                      "Spending change chosen. No money moved; actual savings have not been observed.",
                    );
                    setModal(null);
                  }}
                >
                  Choose this change <Check size={17} />
                </button>
              </>
            ) : modal === "flow" ? (
              <>
                <div className="eyebrow">THE NUMBERS BEHIND THE PICTURE</div>
                <h2 id="dialog-title">What’s spoken for?</h2>
                <p>
                  Sample estimate through November 27. The next paycheck is
                  expected, not counted as cash available now.
                </p>
                <div className="breakdown">
                  <div>
                    <span>Checking now</span>
                    <strong>{usd(state.checking)}</strong>
                  </div>
                  <div>
                    <span>Rent</span>
                    <span>−$1,200</span>
                  </div>
                  <div>
                    <span>Card repayment</span>
                    <span>−$680</span>
                  </div>
                  <div>
                    <span>Estimated utilities</span>
                    <span>−$120</span>
                  </div>
                  <div>
                    <span>Checking cushion</span>
                    <span>−{usd(state.cushion)}</span>
                  </div>
                  <div>
                    <strong>Estimated room</strong>
                    <strong>
                      {complete && state.fresh ? usd(eligible) : "Unavailable"}
                    </strong>
                  </div>
                </div>
                <p className="fine">
                  This simplified demo assumes no other outflows. Real
                  eligibility needs complete transactions, pending-balance
                  semantics, income uncertainty and fresh provider data. Bills
                  may change.
                </p>
              </>
            ) : modal === "consent" ? (
              <>
                <div className="eyebrow">
                  DEMO RULE AUTHORIZATION · VERSION 1
                </div>
                <h2 id="dialog-title">Your plan. Your boundaries.</h2>
                <div className="subtle-box">
                  <strong>Checking → savings → investments</strong>
                  <p>
                    Keep {usd(state.cushion)} in checking after bills. Replenish
                    savings to {usd(state.target)} first. Maximum{" "}
                    {usd(state.limit)} per simulated run. Investments pause
                    below the reserve target; all actions stop with stale or
                    incomplete data.
                  </p>
                </div>
                <p>
                  <strong>Today:</strong> authorize a demo rule. No real money
                  moves.
                  <br />
                  <strong>Later:</strong> a real provider would need verified
                  capabilities, schedules, rolling limits, consent and
                  reconciled outcomes.
                  <br />
                  <strong>Risks:</strong> missing bills, changing income,
                  transfer delays and investment losses.
                </p>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={consentCheck}
                    onChange={(e) => setConsentCheck(e.target.checked)}
                  />
                  I understand this is simulation only. I can pause or revoke
                  this demo rule at any time.
                </label>
                <button
                  className="button primary wide"
                  disabled={!consentCheck || !complete || !state.fresh}
                  onClick={() => {
                    update({
                      consent: true,
                      paused: false,
                      events: [
                        event(
                          "Demo rule authorized",
                          `Cushion ${usd(state.cushion)} · reserve ${usd(state.target)} · cap ${usd(state.limit)} per simulated run`,
                        ),
                        ...state.events,
                      ],
                    });
                    setModal(null);
                    setNotice(
                      "Demo rule authorized. Run a simulation to see what happens next.",
                    );
                  }}
                >
                  Authorize demo rule <ShieldCheck size={17} />
                </button>
                {(!complete || !state.fresh) && (
                  <p className="fine">
                    Add all sample accounts and restore fresh data before
                    authorizing.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="eyebrow">SIMULATED WITHDRAWAL</div>
                <h2 id="dialog-title">Bring cash back to checking.</h2>
                <p>
                  Robinhood cash → Chase checking. Sample withdrawable cash:{" "}
                  {usd(state.brokerageCash)}. Holdings are not instantly
                  spendable.
                </p>
                <label>
                  Amount
                  <div className="money-input">
                    <span>$</span>
                    <input
                      autoFocus
                      aria-label="Withdrawal amount"
                      type="number"
                      min="1"
                      max={state.brokerageCash}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                    />
                  </div>
                </label>
                <div className="subtle-box">
                  <strong>Cash and selling are separate.</strong>
                  <p>
                    This simulation only withdraws existing cash. Selling stocks
                    would require separate permission, price and tax
                    information, then settlement before withdrawal. Live funding
                    and withdrawals are unverified.
                  </p>
                </div>
                <button
                  className="button primary wide"
                  disabled={
                    !state.fresh ||
                    !state.connected.includes("checking") ||
                    amount <= 0 ||
                    amount > state.brokerageCash ||
                    !Number.isFinite(amount)
                  }
                  onClick={() => {
                    setState((s) => ({
                      ...s,
                      checking: s.checking + amount,
                      brokerageCash: s.brokerageCash - amount,
                      events: [
                        event(
                          "Cash withdrawal simulated",
                          "Robinhood cash → Chase. Instant demo confirmation; real transfers can take time.",
                          amount,
                        ),
                        ...s.events,
                      ],
                    }));
                    setModal(null);
                    setNotice(
                      "Withdrawal simulated. No real cash moved or investments sold.",
                    );
                  }}
                >
                  Simulate withdrawal <ArrowDownLeft size={17} />
                </button>
                {!state.fresh && (
                  <p className="fine">
                    Withdrawal blocked: restore fresh sample data first.
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
