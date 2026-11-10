import Link from "next/link";
import type { ReactNode } from "react";

import "@/features/student/styles/mm-canvas.css";

export type MySpaceCanvasState =
  | "resume"
  | "no-resume"
  | "first-visit"
  | "loading"
  | "empty-error";

export function resolveMySpaceState(raw?: string): MySpaceCanvasState {
  if (raw === "first-visit") return "first-visit";
  if (raw === "no-resume") return "no-resume";
  if (raw === "loading") return "loading";
  if (raw === "empty-error") return "empty-error";
  return "resume";
}

function NavIconHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function NavIconLearn() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

function NavIconPractice() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function NavIconExams() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}

function NavIconResults() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function NavIconHelp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function IconSliders() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h10" />
      <path d="M18 8h2" />
      <circle cx="16" cy="8" r="2" />
      <path d="M4 16h4" />
      <path d="M12 16h8" />
      <circle cx="10" cy="16" r="2" />
    </svg>
  );
}

function CanvasLogo() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="mm-logo__mark" src="/brand/mark-96.webp" alt="" width={96} height={96} />
      <span className="mm-logo__word">
        <span className="mm-logo__mind">Mind</span>
        <span className="mm-logo__mosaic">Mosaic</span>
        <span className="mm-logo__tm" aria-hidden="true">
          ®
        </span>
      </span>
    </>
  );
}

export function StudentCanvasShell({
  active = "home",
  title = "My Space",
  studentName = "Kiran M.",
  studentInitial = "K",
  yearLevel = 5,
  isFirstVisit = false,
  isLoading = false,
  boxedHelpIcon = false,
  children,
}: {
  active?: "home" | "learn" | "practice" | "examCentre" | "results";
  title?: string;
  studentName?: string;
  studentInitial?: string;
  yearLevel?: 3 | 5;
  isFirstVisit?: boolean;
  isLoading?: boolean;
  boxedHelpIcon?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mm-canvas-root">
      <div className="mm-app" style={{ minHeight: "100vh" }}>
        <aside className="mm-side" aria-label="My Space">
          <Link className="mm-logo mm-logo--md" href="/student" aria-label="MindMosaic — My Space">
            <CanvasLogo />
          </Link>
          <nav aria-label="My Space">
            <Link className="mm-sidelink" href="/student" aria-current={active === "home" ? "page" : undefined}>
              <NavIconHome />
              My Space
            </Link>
            <Link className="mm-sidelink" href="/student/learn" aria-current={active === "learn" ? "page" : undefined}>
              <NavIconLearn />
              Learning Hub
            </Link>
            <Link className="mm-sidelink" href="/student/practice" aria-current={active === "practice" ? "page" : undefined}>
              <NavIconPractice />
              Practice Studio
            </Link>
            <Link className="mm-sidelink" href="/student/exam-preparation" aria-current={active === "examCentre" ? "page" : undefined}>
              <NavIconExams />
              Exam Centre
            </Link>
            <Link className="mm-sidelink" href="/student/results" aria-current={active === "results" ? "page" : undefined}>
              <NavIconResults />
              My Results
            </Link>
          </nav>
          <div className="mm-side__foot">
            {isFirstVisit && !isLoading && (
              <div
                style={{
                  background: "var(--mm-tint)",
                  border: "1px solid rgba(89,37,168,.14)",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 600 }}>New here?</p>
                <p className="mm-caption" style={{ marginTop: 4 }}>
                  The Help Centre has a two-minute tour of each place.
                </p>
                <Link className="mm-link" href="/student/support" style={{ fontSize: 14, minHeight: 36, marginTop: 4 }}>
                  Take the tour
                  <IconArrowRight />
                </Link>
              </div>
            )}
            <Link className="mm-sidelink" href="/student/support">
              <NavIconHelp />
              Help Centre
            </Link>
            {isLoading ? (
              <div className="mm-sidelink" style={{ padding: "8px 12px", minHeight: 56, background: "var(--mm-tint-soft)" }}>
                <span className="mm-skel" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
                <span style={{ display: "grid", gap: 5, minWidth: 0, flex: "1 1 auto" }}>
                  <span className="mm-skel" style={{ width: 74, height: 11 }} />
                  <span className="mm-skel" style={{ width: 96, height: 10 }} />
                </span>
              </div>
            ) : (
              <Link
                className="mm-sidelink"
                href="/student/profile"
                style={{ padding: "8px 12px", minHeight: 56, background: "var(--mm-tint-soft)" }}
              >
                <span className="mm-avatar">{studentInitial}</span>
                <span style={{ display: "grid", lineHeight: 1.3, minWidth: 0 }}>
                  <b style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--mm-ink)" }}>{studentName}</b>
                  <span style={{ fontSize: "12.5px", color: "var(--mm-muted)" }}>Year {yearLevel} · account</span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ marginLeft: "auto" }}
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            )}
          </div>
        </aside>

        <div className="mm-main">
          <div className="mm-topbar">
            <div className="mm-topbar__m">
              <span className="mm-logo mm-logo--sm" role="img" aria-label="MindMosaic">
                <CanvasLogo />
              </span>
            </div>
            <p className="mm-small mm-topbar__title" style={{ margin: 0 }}>
              {title}
            </p>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              {!isLoading && (
                <span className="mm-small mm-hide-sm">
                  <span className="mm-illus">
                    <IconInfo />
                    Sample student
                  </span>
                </span>
              )}
              <Link
                className={boxedHelpIcon ? "mm-iconbtn mm-iconbtn--boxed" : "mm-iconbtn"}
                href="/student/support"
                aria-label="Help Centre"
              >
                <NavIconHelp />
              </Link>
              {isLoading ? (
                <span className="mm-skel" style={{ width: 36, height: 36, borderRadius: 10 }} />
              ) : (
                <Link
                  href="/student/profile"
                  aria-label={`${studentName}, Year ${yearLevel} — account`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 44,
                    minHeight: 44,
                    borderRadius: 12,
                  }}
                >
                  <span className="mm-avatar">{studentInitial}</span>
                </Link>
              )}
            </div>
          </div>

          <main
            id="main-content"
            className="mm-content"
            aria-busy={isLoading ? "true" : undefined}
            aria-labelledby={isLoading ? "ld-live" : undefined}
          >
            {children}
          </main>

          <nav className="mm-bottomnav" aria-label="My Space">
            <Link href="/student" aria-current={active === "home" ? "page" : undefined} aria-label="My Space">
              <NavIconHome />
              My Space
            </Link>
            <Link href="/student/learn" aria-current={active === "learn" ? "page" : undefined} aria-label="Learning Hub">
              <NavIconLearn />
              Learning
            </Link>
            <Link href="/student/practice" aria-current={active === "practice" ? "page" : undefined} aria-label="Practice Studio">
              <NavIconPractice />
              Practice
            </Link>
            <Link href="/student/exam-preparation" aria-current={active === "examCentre" ? "page" : undefined} aria-label="Exam Centre">
              <NavIconExams />
              Exams
            </Link>
            <Link href="/student/results" aria-current={active === "results" ? "page" : undefined} aria-label="My Results">
              <NavIconResults />
              Results
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}

function ReturningMySpaceContent() {
  return (
    <>
      {/* Greeting */}
      <div className="mm-greet">
        <div>
          <p className="mm-small">Tuesday 10 November</p>
          <h1 className="mm-page-title" style={{ marginTop: 4 }}>
            Good afternoon, Kiran
          </h1>
          <p style={{ marginTop: 8, fontSize: 17, color: "var(--mm-ink-soft)" }}>
            Year 5 · NAPLAN-style, ICAS-style and curriculum lessons are open for you.
          </p>
          <p className="mm-illus mm-only-sm-flex" style={{ marginTop: 10 }}>
            <IconInfo />
            Sample student · illustrative data
          </p>
        </div>
        <div className="mm-hide-sm" style={{ minWidth: 252 }}>
          <p className="mm-label" style={{ color: "var(--mm-muted)", fontSize: 13 }}>
            Practice in the last 7 days
          </p>
          <ul className="mm-week" aria-label="Practice in the last seven days" style={{ marginTop: 8 }}>
            <li className="mm-day is-on">
              <i>
                <IconCheck />
              </i>
              <span>Wed</span>
              <span className="mm-sr">practised</span>
            </li>
            <li className="mm-day">
              <i />
              <span>Thu</span>
              <span className="mm-sr">no practice</span>
            </li>
            <li className="mm-day is-on">
              <i>
                <IconCheck />
              </i>
              <span>Fri</span>
              <span className="mm-sr">practised</span>
            </li>
            <li className="mm-day">
              <i />
              <span>Sat</span>
              <span className="mm-sr">no practice</span>
            </li>
            <li className="mm-day">
              <i />
              <span>Sun</span>
              <span className="mm-sr">no practice</span>
            </li>
            <li className="mm-day is-on">
              <i>
                <IconCheck />
              </i>
              <span>Mon</span>
              <span className="mm-sr">practised</span>
            </li>
            <li className="mm-day is-today">
              <i />
              <span>Tue</span>
              <span className="mm-sr">no practice yet, today</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Actions 1 and 2 */}
      <div className="mm-grid--actions">
        {/* 1 · Continue */}
        <section className="mm-starthere" aria-labelledby="h-continue">
          <div className="mm-starthere__body">
            <p className="mm-eyebrow">Pick up where you left off</p>
            <h2 id="h-continue">ICAS-style Mathematics</h2>
            <p className="mm-small" style={{ marginTop: 8 }}>
              Timed paper · Year 5 · started at 4:02 pm today
            </p>

            <div style={{ marginTop: 20, maxWidth: 380 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <span className="mm-label mm-tnum">18 answered · 12 to go</span>
                <span className="mm-small mm-tnum">21:40 left on the clock</span>
              </div>
              <div className="mm-progress" style={{ marginTop: 8 }}>
                <span style={{ width: "60%" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
              <Link className="mm-btn mm-btn--primary mm-btn--lg" href="/student/exam-preparation">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />
                </svg>
                Carry on with this paper
              </Link>
              <Link className="mm-btn mm-btn--ghost" href="/student/exam-preparation">
                <IconClock />
                Submit it now
              </Link>
            </div>
            <p className="mm-caption" style={{ marginTop: 14 }}>
              Your 18 answers were saved on our server at 4:02 pm. The clock keeps running while you are away, and the paper is submitted for you if the time runs out.
            </p>
          </div>
          <div className="mm-starthere__art" aria-hidden="true">
            <svg
              viewBox="0 0 240 340"
              preserveAspectRatio="xMidYMid slice"
              role="img"
              aria-label="Exercise-book sketch: a bar split into fifths with three parts shaded, above a number line"
            >
              <defs>
                <pattern id="mmPaperA" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M16 0H0V16" fill="none" stroke="#C9B6E4" strokeWidth="1" opacity="0.38" />
                </pattern>
              </defs>
              <rect width="240" height="340" fill="#FCFBF8" />
              <rect width="240" height="340" fill="url(#mmPaperA)" />
              <line x1="30" y1="0" x2="30" y2="340" stroke="#FF555A" strokeWidth="1.5" opacity="0.75" />
              <g transform="translate(52,86)">
                <text x="0" y="-14" fontFamily="Instrument Sans, system-ui, sans-serif" fontSize="19" fontWeight="500" fill="#18151F">
                  3/5
                </text>
                <rect x="0" y="0" width="150" height="46" rx="3" fill="#FFFFFF" stroke="#5925A8" strokeWidth="2" />
                <rect x="2" y="2" width="88" height="42" fill="#5925A8" opacity="0.16" />
                <line x1="30" y1="0" x2="30" y2="46" stroke="#5925A8" strokeWidth="1.5" />
                <line x1="60" y1="0" x2="60" y2="46" stroke="#5925A8" strokeWidth="1.5" />
                <line x1="90" y1="0" x2="90" y2="46" stroke="#5925A8" strokeWidth="1.5" />
                <line x1="120" y1="0" x2="120" y2="46" stroke="#5925A8" strokeWidth="1.5" />
              </g>
              <g transform="translate(52,200)">
                <line x1="0" y1="0" x2="150" y2="0" stroke="#18151F" strokeWidth="2" />
                <line x1="0" y1="-7" x2="0" y2="7" stroke="#18151F" strokeWidth="2" />
                <line x1="30" y1="-5" x2="30" y2="5" stroke="#625D69" strokeWidth="1.5" />
                <line x1="60" y1="-5" x2="60" y2="5" stroke="#625D69" strokeWidth="1.5" />
                <line x1="90" y1="-5" x2="90" y2="5" stroke="#625D69" strokeWidth="1.5" />
                <line x1="120" y1="-5" x2="120" y2="5" stroke="#625D69" strokeWidth="1.5" />
                <line x1="150" y1="-7" x2="150" y2="7" stroke="#18151F" strokeWidth="2" />
                <circle cx="90" cy="0" r="5.5" fill="#FF555A" />
                <text x="-3" y="24" fontFamily="Geist, system-ui, sans-serif" fontSize="12" fill="#625D69">
                  0
                </text>
                <text x="147" y="24" fontFamily="Geist, system-ui, sans-serif" fontSize="12" fill="#625D69">
                  1
                </text>
              </g>
              <g transform="translate(52,268)" fill="none" stroke="#C9B6E4" strokeWidth="1.5">
                <circle cx="8" cy="8" r="7" />
                <line x1="15" y1="8" x2="45" y2="8" />
                <circle cx="52" cy="8" r="7" />
                <line x1="59" y1="8" x2="89" y2="8" />
                <circle cx="96" cy="8" r="7" />
              </g>
            </svg>
          </div>
        </section>

        {/* 2 · Start practice */}
        <section className="mm-card" aria-labelledby="h-practice" style={{ display: "grid", gap: 16 }}>
          <div>
            <h2 id="h-practice">Start practice</h2>
            <p className="mm-small" style={{ marginTop: 4 }}>
              Short sets with a worked explanation on every question.
            </p>
          </div>

          <div
            style={{
              background: "var(--mm-tint-soft)",
              border: "1px solid var(--mm-line)",
              borderRadius: "var(--radius-card)",
              padding: 18,
            }}
          >
            <p className="mm-label" style={{ color: "var(--mm-brand)" }}>
              Suggested for you
            </p>
            <p style={{ marginTop: 6, fontSize: "15.5px", fontWeight: 600 }}>Statistics and probability</p>
            <p className="mm-small" style={{ marginTop: 4 }}>
              Because you got 2 of 5 statistics marks in your last set, on Mon 9 Nov. 5 questions are ready.
            </p>
            <Link className="mm-btn mm-btn--primary mm-btn--block" href="/student/practice" style={{ marginTop: 14 }}>
              Practise 5 missed skills
            </Link>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <Link className="mm-btn mm-btn--outline mm-btn--block" href="/student/practice">
              <NavIconPractice />
              Choose what to practise
            </Link>
            <Link className="mm-btn mm-btn--ghost mm-btn--block" href="/student/practice">
              <IconSliders />
              Build your own set
            </Link>
          </div>
          <p className="mm-caption">
            Suggestions come from your most recent set only — we don&apos;t look across all your sets yet. One appears only when there are unseen questions for that skill.
          </p>
        </section>
      </div>

      {/* 3 · Recent results */}
      <section className="mm-card" aria-labelledby="h-results" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h2 id="h-results">Recent results</h2>
            <p className="mm-small" style={{ marginTop: 4 }}>
              Marks on the questions you answered, with every explanation.
            </p>
          </div>
          <Link className="mm-link" href="/student/results">
            All results
            <IconArrowRight />
          </Link>
        </div>
        <div className="mm-list" style={{ marginTop: 10 }}>
          <div className="mm-li">
            <span className="mm-li__ic">
              <NavIconPractice />
            </span>
            <div>
              <b>ICAS-style Mathematics · practice</b>
              <span>
                Mon 9 Nov · <span className="mm-tnum">6 of 10 marks</span>
              </span>
            </div>
            <Link className="mm-btn mm-btn--outline mm-btn--sm" href="/student/results/att-num-301/review">
              Review answers
            </Link>
          </div>
          <div className="mm-li">
            <span className="mm-li__ic">
              <NavIconExams />
            </span>
            <div>
              <b>NAPLAN-style Numeracy · timed test</b>
              <span>
                Thu 5 Nov · <span className="mm-tnum">24 of 32 marks</span> · 41 of 45 min
              </span>
            </div>
            <Link className="mm-btn mm-btn--outline mm-btn--sm" href="/student/results/att-num-301/review">
              Review answers
            </Link>
          </div>
          <div className="mm-li">
            <span className="mm-li__ic">
              <NavIconPractice />
            </span>
            <div>
              <b>NAPLAN-style Reading · practice</b>
              <span>
                Tue 3 Nov · <span className="mm-tnum">8 of 10 marks</span>
              </span>
            </div>
            <Link className="mm-btn mm-btn--outline mm-btn--sm" href="/student/results/att-num-301/review">
              Review answers
            </Link>
          </div>
        </div>
      </section>

      {/* 4 · My Progress */}
      <section className="mm-card" aria-labelledby="h-progress" style={{ marginTop: 32 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h2 id="h-progress">My progress</h2>
            <p className="mm-small" style={{ marginTop: 4 }}>
              From your 6 finished sets and tests between 24 October and 10 November. Lessons you read aren&apos;t counted here.
            </p>
          </div>
          <Link className="mm-link" href="/student/engagement">
            See all progress
            <IconArrowRight />
          </Link>
        </div>

        <div className="mm-only-sm" style={{ marginTop: 16 }}>
          <p className="mm-label" style={{ color: "var(--mm-muted)", fontSize: 13 }}>
            Practice in the last 7 days
          </p>
          <ul className="mm-week" aria-label="Practice in the last seven days">
            <li className="mm-day is-on">
              <i>
                <IconCheck />
              </i>
              <span>W</span>
              <span className="mm-sr">Wednesday, practised</span>
            </li>
            <li className="mm-day">
              <i />
              <span>T</span>
              <span className="mm-sr">Thursday, no practice</span>
            </li>
            <li className="mm-day is-on">
              <i>
                <IconCheck />
              </i>
              <span>F</span>
              <span className="mm-sr">Friday, practised</span>
            </li>
            <li className="mm-day">
              <i />
              <span>S</span>
              <span className="mm-sr">Saturday, no practice</span>
            </li>
            <li className="mm-day">
              <i />
              <span>S</span>
              <span className="mm-sr">Sunday, no practice</span>
            </li>
            <li className="mm-day is-on">
              <i>
                <IconCheck />
              </i>
              <span>M</span>
              <span className="mm-sr">Monday, practised</span>
            </li>
            <li className="mm-day is-today">
              <i />
              <span>T</span>
              <span className="mm-sr">Tuesday, no practice yet, today</span>
            </li>
          </ul>
        </div>

        <div className="mm-grid--progress">
          <div>
            <h3 className="mm-h3" style={{ fontSize: 16 }}>
              Marks by subject
            </h3>
            <div className="mm-bars" style={{ marginTop: 12 }}>
              <div className="mm-bar">
                <span>Reading</span>
                <span className="mm-bar__v">17 of 20 marks</span>
                <div className="mm-progress">
                  <span style={{ width: "85%" }} />
                </div>
              </div>
              <div className="mm-bar">
                <span>Numeracy</span>
                <span className="mm-bar__v">24 of 32 marks</span>
                <div className="mm-progress">
                  <span style={{ width: "75%" }} />
                </div>
              </div>
              <div className="mm-bar">
                <span>Mathematics (ICAS-style)</span>
                <span className="mm-bar__v">6 of 10 marks</span>
                <div className="mm-progress">
                  <span style={{ width: "60%" }} />
                </div>
              </div>
              <div className="mm-bar">
                <span>Statistics and probability</span>
                <span className="mm-bar__v">4 of 9 marks</span>
                <div className="mm-progress">
                  <span style={{ width: "44%" }} />
                </div>
              </div>
            </div>
            <p className="mm-caption" style={{ marginTop: 14 }}>
              Each bar is marks you earned out of marks available on the questions you answered — not how much of the subject you have covered.
            </p>
          </div>

          <div
            style={{
              background: "var(--mm-tint-soft)",
              border: "1px solid var(--mm-line)",
              borderRadius: "var(--radius-card)",
              padding: 20,
            }}
          >
            <h3 className="mm-h3" style={{ fontSize: 16 }}>
              What this says
            </h3>
            <ul className="mm-checks" style={{ marginTop: 12, fontSize: "14.5px" }}>
              <li>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--mm-teal)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>
                  <b style={{ fontWeight: 600 }}>Going well: Reading.</b> 17 of 20 marks across 2 sets.
                </span>
              </li>
              <li>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--mm-brand)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
                <span>
                  <b style={{ fontWeight: 600 }}>Worth practising: statistics and probability.</b> 4 of 9 marks across 2 sets — your lowest so far.
                </span>
              </li>
              <li>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--mm-muted)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <span>
                  <b style={{ fontWeight: 600 }}>Not enough yet: Spelling and Digital Technologies.</b> You haven&apos;t answered any questions in these.
                </span>
              </li>
            </ul>
            <Link className="mm-btn mm-btn--outline mm-btn--block" href="/student/practice" style={{ marginTop: 18 }}>
              Practise statistics and probability
            </Link>
          </div>
        </div>

        <p className="mm-caption" style={{ marginTop: 18, maxWidth: "72em" }}>
          MindMosaic does not predict NAPLAN or ICAS bands, compare you with other students, or score how much of a topic you have mastered. These are your marks on the questions you have answered, and nothing else.
        </p>
      </section>

      {/* 5 · Learning pathways */}
      <section aria-labelledby="h-paths" style={{ marginTop: 32 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 id="h-paths" className="mm-section-title">
                Open for Year 5
              </h2>
              <span className="mm-badge mm-badge--brand">Year 5</span>
            </div>
            <p className="mm-small" style={{ marginTop: 6 }}>
              Years 3 and 5 are open now. More year levels are in development.
            </p>
          </div>
          <Link className="mm-link" href="/student/practice">
            All pathways
            <IconArrowRight />
          </Link>
        </div>

        <div className="mm-grid mm-grid--2" style={{ marginTop: 18 }}>
          <Link className="mm-pcard" href="/student/practice">
            <span className="mm-pcard__art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <rect width="88" height="88" fill="#FCFBF8" />
                <line x1="14" y1="52" x2="74" y2="52" stroke="#18151F" strokeWidth="2" />
                <line x1="14" y1="45" x2="14" y2="59" stroke="#18151F" strokeWidth="2" />
                <line x1="29" y1="47" x2="29" y2="57" stroke="#625D69" strokeWidth="1.5" />
                <line x1="44" y1="47" x2="44" y2="57" stroke="#625D69" strokeWidth="1.5" />
                <line x1="59" y1="47" x2="59" y2="57" stroke="#625D69" strokeWidth="1.5" />
                <line x1="74" y1="45" x2="74" y2="59" stroke="#18151F" strokeWidth="2" />
                <circle cx="59" cy="52" r="5" fill="#FF555A" />
                <text x="14" y="32" fontFamily="Instrument Sans, system-ui, sans-serif" fontSize="18" fontWeight="500" fill="#5925A8">
                  12 + 9
                </text>
              </svg>
            </span>
            <div>
              <h3>NAPLAN-style practice &amp; papers</h3>
              <p>Numeracy, Reading and Language conventions. Short sets or a full timed paper.</p>
              <div className="mm-pcard__meta">
                <span className="mm-badge mm-badge--live">
                  <IconCheck />
                  Available
                </span>
                <span className="mm-tag">Year 5</span>
                <span className="mm-tag">3 subjects</span>
              </div>
            </div>
          </Link>

          <Link className="mm-pcard" href="/student/practice">
            <span className="mm-pcard__art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <rect width="88" height="88" fill="#FCFBF8" />
                <line x1="16" y1="68" x2="72" y2="68" stroke="#18151F" strokeWidth="2" />
                <rect x="22" y="44" width="12" height="24" fill="#C9B6E4" stroke="#5925A8" strokeWidth="1.5" />
                <rect x="38" y="30" width="12" height="38" fill="#5925A8" opacity="0.5" stroke="#5925A8" strokeWidth="1.5" />
                <rect x="54" y="52" width="12" height="16" fill="#FFFFFF" stroke="#5925A8" strokeWidth="1.5" />
                <circle cx="60" cy="24" r="6" fill="none" stroke="#FF555A" strokeWidth="2" />
              </svg>
            </span>
            <div>
              <h3>ICAS-style papers</h3>
              <p>Maths, Reading, Language, Digital Technologies and Spelling. Science for Year 5 isn&apos;t ready yet.</p>
              <div className="mm-pcard__meta">
                <span className="mm-badge mm-badge--live">
                  <IconCheck />
                  Available
                </span>
                <span className="mm-tag">Year 5</span>
                <span className="mm-tag">5 subjects</span>
              </div>
            </div>
          </Link>

          <Link className="mm-pcard" href="/student/learn">
            <span className="mm-pcard__art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <rect width="88" height="88" fill="#FCFBF8" />
                <line x1="20" y1="26" x2="68" y2="26" stroke="#5925A8" strokeWidth="2" />
                <line x1="20" y1="38" x2="60" y2="38" stroke="#C9B6E4" strokeWidth="2" />
                <line x1="20" y1="50" x2="66" y2="50" stroke="#C9B6E4" strokeWidth="2" />
                <line x1="20" y1="62" x2="48" y2="62" stroke="#C9B6E4" strokeWidth="2" />
                <path d="M54 62 L60 68 L72 54" fill="none" stroke="#0B6B63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <h3>Curriculum lessons</h3>
              <p>Maths and English. Each lesson has a worked example, a common trap and 4–5 questions.</p>
              <div className="mm-pcard__meta">
                <span className="mm-badge mm-badge--live">
                  <IconCheck />
                  Available
                </span>
                <span className="mm-tag">Year 5</span>
                <span className="mm-tag">50 lessons</span>
                <span className="mm-tag">15 min each</span>
              </div>
            </div>
          </Link>

          <Link className="mm-pcard" href="/student/practice">
            <span className="mm-pcard__art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <rect width="88" height="88" fill="#FCFBF8" />
                <line x1="18" y1="30" x2="70" y2="30" stroke="#C9B6E4" strokeWidth="2" />
                <circle cx="54" cy="30" r="6" fill="#FFFFFF" stroke="#5925A8" strokeWidth="2" />
                <line x1="18" y1="46" x2="70" y2="46" stroke="#C9B6E4" strokeWidth="2" />
                <circle cx="32" cy="46" r="6" fill="#FFFFFF" stroke="#5925A8" strokeWidth="2" />
                <line x1="18" y1="62" x2="70" y2="62" stroke="#C9B6E4" strokeWidth="2" />
                <circle cx="62" cy="62" r="6" fill="#FFFFFF" stroke="#FF555A" strokeWidth="2" />
              </svg>
            </span>
            <div>
              <h3>Build your own practice</h3>
              <p>Pick the subject, how many questions and whether it&apos;s timed. Writing tasks included.</p>
              <div className="mm-pcard__meta">
                <span className="mm-badge mm-badge--live">
                  <IconCheck />
                  Available
                </span>
                <span className="mm-tag">Year 5</span>
                <span className="mm-tag">Any open subject</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="mm-pcard mm-pcard--planned" style={{ marginTop: 18, gridTemplateColumns: "1fr" }}>
          <div>
            <h3>Coming later</h3>
            <p>
              Singapore Maths, AMC-style, Olympiad-style, Selective-entry-style and Scholarship-style are being built. There are no questions in them yet, so they don&apos;t appear in Practice Studio or the Exam Centre.
            </p>
            <div className="mm-pcard__meta">
              <span className="mm-badge mm-badge--planned">
                <IconClock />
                Planned
              </span>
              <span className="mm-tag">5 pathways</span>
              <span className="mm-tag">Year levels to be confirmed</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function NoResumeMySpaceContent() {
  return (
    <>
      <div className="mm-greet">
        <div>
          <p className="mm-small">Thursday 12 November</p>
          <h1 className="mm-page-title" style={{ marginTop: 4 }}>
            Good afternoon, Kiran
          </h1>
          <p style={{ marginTop: 8, fontSize: 17, color: "var(--mm-ink-soft)" }}>
            Nothing is in progress — you finished everything you started.
          </p>
        </div>
        <div className="mm-hide-sm" style={{ minWidth: 252 }}>
          <p className="mm-label" style={{ color: "var(--mm-muted)", fontSize: 13 }}>
            Practice in the last 7 days
          </p>
          <ul className="mm-week" aria-label="Practice in the last seven days" style={{ marginTop: 8 }}>
            <li className="mm-day">
              <i />
              <span>Fri</span>
              <span className="mm-sr">no practice</span>
            </li>
            <li className="mm-day">
              <i />
              <span>Sat</span>
              <span className="mm-sr">no practice</span>
            </li>
            <li className="mm-day">
              <i />
              <span>Sun</span>
              <span className="mm-sr">no practice</span>
            </li>
            <li className="mm-day is-on">
              <i>
                <IconCheck />
              </i>
              <span>Mon</span>
              <span className="mm-sr">practised</span>
            </li>
            <li className="mm-day is-on">
              <i>
                <IconCheck />
              </i>
              <span>Tue</span>
              <span className="mm-sr">practised</span>
            </li>
            <li className="mm-day">
              <i />
              <span>Wed</span>
              <span className="mm-sr">no practice</span>
            </li>
            <li className="mm-day is-today">
              <i />
              <span>Thu</span>
              <span className="mm-sr">no practice yet, today</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mm-grid--actions">
        <section className="mm-starthere" aria-labelledby="n-start">
          <div className="mm-starthere__body">
            <p className="mm-eyebrow">Start practice</p>
            <h2 id="n-start">Statistics and probability</h2>
            <p style={{ marginTop: 10, fontSize: 16, color: "var(--mm-ink-soft)", maxWidth: "40em" }}>
              Five questions, about seven minutes. Each one shows you how it was worked out after you answer.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              <span className="mm-tag">5 questions</span>
              <span className="mm-tag">No timer</span>
              <span className="mm-tag">Stop any time</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
              <Link className="mm-btn mm-btn--primary mm-btn--lg" href="/student/practice">
                Start practice
              </Link>
              <Link className="mm-btn mm-btn--outline" href="/student/practice">
                Choose a topic instead
              </Link>
            </div>
            <p className="mm-caption" style={{ marginTop: 14 }}>
              Suggested because you got 2 of 5 statistics marks in your last set, on Tue 10 Nov. Suggestions come from your most recent set only.
            </p>
          </div>
          <div className="mm-starthere__art" aria-hidden="true">
            <svg viewBox="0 0 240 340" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Exercise-book sketch of a three-column bar chart">
              <defs>
                <pattern id="mmPaperN" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M16 0H0V16" fill="none" stroke="#C9B6E4" strokeWidth="1" opacity="0.38" />
                </pattern>
              </defs>
              <rect width="240" height="340" fill="#FCFBF8" />
              <rect width="240" height="340" fill="url(#mmPaperN)" />
              <line x1="30" y1="0" x2="30" y2="340" stroke="#FF555A" strokeWidth="1.5" opacity="0.75" />
              <g transform="translate(56,96)">
                <line x1="0" y1="0" x2="0" y2="120" stroke="#18151F" strokeWidth="2" />
                <line x1="0" y1="120" x2="148" y2="120" stroke="#18151F" strokeWidth="2" />
                <rect x="20" y="56" width="28" height="64" fill="#5925A8" opacity="0.18" stroke="#5925A8" strokeWidth="2" />
                <rect x="62" y="24" width="28" height="96" fill="#5925A8" opacity="0.45" stroke="#5925A8" strokeWidth="2" />
                <rect x="104" y="80" width="28" height="40" fill="#FFFFFF" stroke="#5925A8" strokeWidth="2" />
                <line x1="-6" y1="24" x2="0" y2="24" stroke="#625D69" strokeWidth="1.5" />
                <line x1="-6" y1="56" x2="0" y2="56" stroke="#625D69" strokeWidth="1.5" />
                <line x1="-6" y1="88" x2="0" y2="88" stroke="#625D69" strokeWidth="1.5" />
                <text x="-20" y="28" fontFamily="Geist, system-ui, sans-serif" fontSize="11" fill="#625D69">
                  12
                </text>
                <text x="-16" y="60" fontFamily="Geist, system-ui, sans-serif" fontSize="11" fill="#625D69">
                  8
                </text>
                <text x="-16" y="92" fontFamily="Geist, system-ui, sans-serif" fontSize="11" fill="#625D69">
                  4
                </text>
              </g>
              <g transform="translate(56,268)" fill="none" stroke="#C9B6E4" strokeWidth="1.5">
                <circle cx="8" cy="8" r="7" />
                <line x1="15" y1="8" x2="45" y2="8" />
                <circle cx="52" cy="8" r="7" />
                <line x1="59" y1="8" x2="89" y2="8" />
                <circle cx="96" cy="8" r="7" />
              </g>
            </svg>
          </div>
        </section>

        <section className="mm-card" aria-labelledby="n-other" style={{ display: "grid", gap: 16 }}>
          <div>
            <h2 id="n-other">Other ways to practise</h2>
            <p className="mm-small" style={{ marginTop: 4 }}>
              Nothing here is compulsory. Pick whatever you feel like.
            </p>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <Link className="mm-btn mm-btn--outline mm-btn--block" href="/student/practice">
              <NavIconPractice />
              Choose what to practise
            </Link>
            <Link className="mm-btn mm-btn--outline mm-btn--block" href="/student/practice">
              <IconSliders />
              Build your own set
            </Link>
            <Link className="mm-btn mm-btn--outline mm-btn--block" href="/student/exam-preparation">
              <NavIconExams />
              Sit a timed paper
            </Link>
            <Link className="mm-btn mm-btn--ghost mm-btn--block" href="/student/learn">
              <NavIconLearn />
              Read a lesson
            </Link>
          </div>
          <p className="mm-caption">
            There is no “Continue” here because nothing is saved part-way. The card appears only when the server confirms a set you can pick up.
          </p>
        </section>
      </div>

      <section className="mm-card" aria-labelledby="n-results" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h2 id="n-results">Recent results</h2>
            <p className="mm-small" style={{ marginTop: 4 }}>
              Marks on the questions you answered, with every explanation.
            </p>
          </div>
          <Link className="mm-link" href="/student/results">
            All results
            <IconArrowRight />
          </Link>
        </div>
        <div className="mm-list" style={{ marginTop: 10 }}>
          <div className="mm-li">
            <span className="mm-li__ic">
              <NavIconPractice />
            </span>
            <div>
              <b>ICAS-style Mathematics · practice</b>
              <span>
                Tue 10 Nov · <span className="mm-tnum">7 of 10 marks</span> · finished
              </span>
            </div>
            <Link className="mm-btn mm-btn--outline mm-btn--sm" href="/student/results/att-num-301/review">
              Review answers
            </Link>
          </div>
          <div className="mm-li">
            <span className="mm-li__ic">
              <NavIconExams />
            </span>
            <div>
              <b>NAPLAN-style Numeracy · timed test</b>
              <span>
                Mon 9 Nov · <span className="mm-tnum">24 of 32 marks</span> · 41 of 45 min
              </span>
            </div>
            <Link className="mm-btn mm-btn--outline mm-btn--sm" href="/student/results/att-num-301/review">
              Review answers
            </Link>
          </div>
        </div>
      </section>

      <section className="mm-card" aria-labelledby="n-progress" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h2 id="n-progress">My progress</h2>
            <p className="mm-small" style={{ marginTop: 4 }}>
              From your 7 finished sets and tests between 24 October and 12 November. Lessons you read aren&apos;t counted here.
            </p>
          </div>
          <Link className="mm-link" href="/student/engagement">
            See all progress
            <IconArrowRight />
          </Link>
        </div>
        <div className="mm-grid--progress">
          <div>
            <h3 className="mm-h3" style={{ fontSize: 16 }}>
              Marks by subject
            </h3>
            <div className="mm-bars" style={{ marginTop: 12 }}>
              <div className="mm-bar">
                <span>Reading</span>
                <span className="mm-bar__v">17 of 20 marks</span>
                <div className="mm-progress">
                  <span style={{ width: "85%" }} />
                </div>
              </div>
              <div className="mm-bar">
                <span>Numeracy</span>
                <span className="mm-bar__v">24 of 32 marks</span>
                <div className="mm-progress">
                  <span style={{ width: "75%" }} />
                </div>
              </div>
              <div className="mm-bar">
                <span>Mathematics (ICAS-style)</span>
                <span className="mm-bar__v">13 of 20 marks</span>
                <div className="mm-progress">
                  <span style={{ width: "65%" }} />
                </div>
              </div>
              <div className="mm-bar">
                <span>Statistics and probability</span>
                <span className="mm-bar__v">6 of 14 marks</span>
                <div className="mm-progress">
                  <span style={{ width: "43%" }} />
                </div>
              </div>
            </div>
            <p className="mm-caption" style={{ marginTop: 14 }}>
              Each bar is marks you earned out of marks available on the questions you answered — not how much of the subject you have covered.
            </p>
          </div>
          <div
            style={{
              background: "var(--mm-tint-soft)",
              border: "1px solid var(--mm-line)",
              borderRadius: "var(--radius-card)",
              padding: 20,
            }}
          >
            <h3 className="mm-h3" style={{ fontSize: 16 }}>
              What this says
            </h3>
            <ul className="mm-checks" style={{ marginTop: 12, fontSize: "14.5px" }}>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--mm-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>
                  <b style={{ fontWeight: 600 }}>Going well: Reading.</b> 17 of 20 marks across 2 sets.
                </span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--mm-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
                <span>
                  <b style={{ fontWeight: 600 }}>Worth practising: statistics and probability.</b> 6 of 14 marks across 3 sets — your lowest so far.
                </span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--mm-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <span>
                  <b style={{ fontWeight: 600 }}>Not enough yet: Spelling and Digital Technologies.</b> You haven&apos;t answered any questions in these.
                </span>
              </li>
            </ul>
          </div>
        </div>
        <p className="mm-caption" style={{ marginTop: 18, maxWidth: "72em" }}>
          MindMosaic does not predict NAPLAN or ICAS bands, compare you with other students, or score how much of a topic you have mastered. These are your marks on the questions you have answered, and nothing else.
        </p>
      </section>

      <section
        className="mm-card mm-card--flat"
        aria-labelledby="n-paths"
        style={{
          marginTop: 24,
          border: "1px solid var(--mm-line)",
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2 id="n-paths" style={{ fontSize: 19 }}>
            Open for Year 5
          </h2>
          <p className="mm-small" style={{ marginTop: 4 }}>
            NAPLAN-style, ICAS-style, curriculum lessons and build-your-own. Years 3 and 5 are open now.
          </p>
        </div>
        <Link className="mm-btn mm-btn--outline" href="/student/practice">
          See all pathways
        </Link>
      </section>
    </>
  );
}

function FirstVisitMySpaceContent() {
  return (
    <>
      <div>
        <p className="mm-eyebrow">First visit</p>
        <h1 className="mm-page-title" style={{ marginTop: 8 }}>
          Welcome, Aisha
        </h1>
        <p style={{ marginTop: 8, fontSize: 17, color: "var(--mm-ink-soft)", maxWidth: "56em" }}>
          Your Year 3 space is ready. Nothing here is marked or scored yet — this page fills in as you practise.
        </p>
        <p className="mm-illus mm-only-sm-flex" style={{ marginTop: 10 }}>
          <IconInfo />
          Sample student · illustrative data
        </p>
      </div>

      <div className="mm-grid--actions">
        <section className="mm-starthere" aria-labelledby="f-start">
          <div className="mm-starthere__body">
            <p className="mm-eyebrow">Start here</p>
            <h2 id="f-start">Your first practice set</h2>
            <p style={{ marginTop: 10, fontSize: 16, color: "var(--mm-ink-soft)", maxWidth: "40em" }}>
              Ten questions on Number and algebra, about 12 minutes. After each answer you see exactly how it was worked out — right or wrong.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              <span className="mm-tag">10 questions</span>
              <span className="mm-tag">No timer</span>
              <span className="mm-tag">Stop any time</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
              <Link className="mm-btn mm-btn--primary mm-btn--lg" href="/student/practice">
                Start practice
              </Link>
              <Link className="mm-btn mm-btn--outline" href="/student/learn">
                Read a lesson first
              </Link>
            </div>
            <p className="mm-caption" style={{ marginTop: 14 }}>
              You can stop part-way. Your place is saved and this card becomes “Continue practice”.
            </p>
          </div>
          <div className="mm-starthere__art" aria-hidden="true">
            <svg viewBox="0 0 240 320" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Exercise-book sketch of a ten-frame with three counters filled">
              <defs>
                <pattern id="mmPaperF" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M16 0H0V16" fill="none" stroke="#C9B6E4" strokeWidth="1" opacity="0.38" />
                </pattern>
              </defs>
              <rect width="240" height="320" fill="#FCFBF8" />
              <rect width="240" height="320" fill="url(#mmPaperF)" />
              <line x1="30" y1="0" x2="30" y2="320" stroke="#FF555A" strokeWidth="1.5" opacity="0.75" />
              <g transform="translate(52,96)">
                <rect x="0" y="0" width="150" height="60" rx="3" fill="#FFFFFF" stroke="#5925A8" strokeWidth="2" />
                <line x1="30" y1="0" x2="30" y2="60" stroke="#5925A8" strokeWidth="1.5" />
                <line x1="60" y1="0" x2="60" y2="60" stroke="#5925A8" strokeWidth="1.5" />
                <line x1="90" y1="0" x2="90" y2="60" stroke="#5925A8" strokeWidth="1.5" />
                <line x1="120" y1="0" x2="120" y2="60" stroke="#5925A8" strokeWidth="1.5" />
                <line x1="0" y1="30" x2="150" y2="30" stroke="#5925A8" strokeWidth="1.5" />
                <circle cx="15" cy="15" r="8" fill="#5925A8" opacity="0.6" />
                <circle cx="45" cy="15" r="8" fill="#5925A8" opacity="0.6" />
                <circle cx="75" cy="15" r="8" fill="#5925A8" opacity="0.6" />
                <circle cx="105" cy="15" r="8" fill="none" stroke="#C9B6E4" strokeWidth="1.5" />
                <circle cx="135" cy="15" r="8" fill="none" stroke="#C9B6E4" strokeWidth="1.5" />
                <text x="0" y="-14" fontFamily="Instrument Sans, system-ui, sans-serif" fontSize="19" fontWeight="500" fill="#18151F">
                  3 + ?
                </text>
              </g>
              <g transform="translate(52,214)" fill="none" stroke="#C9B6E4" strokeWidth="1.5">
                <circle cx="8" cy="8" r="7" />
                <line x1="15" y1="8" x2="45" y2="8" />
                <circle cx="52" cy="8" r="7" />
                <line x1="59" y1="8" x2="89" y2="8" />
                <circle cx="96" cy="8" r="7" />
              </g>
            </svg>
          </div>
        </section>

        <section className="mm-card" aria-labelledby="f-why" style={{ display: "grid", gap: 16 }}>
          <div>
            <h2 id="f-why">Why this set?</h2>
            <span className="mm-badge mm-badge--neutral" style={{ marginTop: 8 }}>
              From your warm-up
            </span>
          </div>
          <div
            style={{
              background: "var(--mm-tint-soft)",
              border: "1px solid var(--mm-line)",
              borderRadius: "var(--radius-card)",
              padding: 18,
            }}
          >
            <p style={{ fontSize: "15.5px", fontWeight: 600 }}>Number and algebra</p>
            <p className="mm-small" style={{ marginTop: 6 }}>
              You answered <span className="mm-tnum">3 of 5</span> in the five-question warm-up when you joined. Both questions you missed were about place value, so this set starts there.
            </p>
            <p className="mm-caption" style={{ marginTop: 10 }}>
              Five warm-up questions is a small sample. This is a starting point, not a judgement about what you can do.
            </p>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <Link className="mm-btn mm-btn--outline mm-btn--block" href="/student/practice">
              <NavIconPractice />
              Choose a different topic
            </Link>
            <Link className="mm-btn mm-btn--ghost mm-btn--block" href="/student/results/att-num-301/review">
              See your warm-up answers
            </Link>
          </div>
        </section>
      </div>

      {/* Orientation */}
      <section className="mm-card" aria-labelledby="f-places" style={{ marginTop: 24 }}>
        <h2 id="f-places">Three places to know</h2>
        <dl className="mm-facts3" style={{ marginTop: 16 }}>
          <div>
            <dt>Learning Hub</dt>
            <dd>Lessons with a worked example and a common trap. 54 lessons for Year 3 in Maths and English.</dd>
          </div>
          <div>
            <dt>Practice Studio</dt>
            <dd>Short sets you can stop any time. Every question explains itself after you answer.</dd>
          </div>
          <div>
            <dt>Exam Centre</dt>
            <dd>Timed papers when you want to practise under exam conditions. Nothing here is compulsory.</dd>
          </div>
        </dl>
      </section>

      {/* Empty states */}
      <div className="mm-grid mm-grid--2" style={{ marginTop: 24, alignItems: "start" }}>
        <section className="mm-card" aria-labelledby="f-results">
          <h2 id="f-results">Recent results</h2>
          <div className="mm-state" style={{ marginTop: 18, gap: 12 }}>
            <span className="mm-li__ic" style={{ width: 48, height: 48 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 22, height: 22 }}>
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </span>
            <p style={{ fontWeight: 600, fontSize: 17 }}>No results yet</p>
            <p className="mm-small">Your marks and answer review appear here as soon as you finish a practice set or a test.</p>
          </div>
        </section>

        <section className="mm-card" aria-labelledby="f-progress">
          <h2 id="f-progress">My progress</h2>
          <div className="mm-state" style={{ marginTop: 18, gap: 12 }}>
            <span className="mm-li__ic" style={{ width: 48, height: 48 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 22, height: 22 }}>
                <path d="M3 3v18h18" />
                <path d="M7 16v-4" />
                <path d="M12 16V9" />
                <path d="M17 16v-7" />
              </svg>
            </span>
            <p style={{ fontWeight: 600, fontSize: 17 }}>Nothing to show yet</p>
            <p className="mm-small">
              Strengths and things to practise come from finished sets and tests. Lessons you read aren&apos;t counted here. Your warm-up is too small a sample to chart.
            </p>
            <Link className="mm-btn mm-btn--outline mm-btn--sm" href="/student/practice" style={{ marginTop: 4 }}>
              Start a practice set
            </Link>
          </div>
        </section>
      </div>

      {/* Pathways for Year 3 */}
      <section aria-labelledby="f-paths" style={{ marginTop: 32 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 id="f-paths" className="mm-section-title">
                Open for Year 3
              </h2>
              <span className="mm-badge mm-badge--brand">Year 3</span>
            </div>
            <p className="mm-small" style={{ marginTop: 6 }}>
              Years 3 and 5 are open now. More year levels are in development.
            </p>
          </div>
        </div>

        <div className="mm-grid mm-grid--2" style={{ marginTop: 18 }}>
          <Link className="mm-pcard" href="/student/practice">
            <span className="mm-pcard__art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <rect width="88" height="88" fill="#FCFBF8" />
                <line x1="14" y1="52" x2="74" y2="52" stroke="#18151F" strokeWidth="2" />
                <line x1="14" y1="45" x2="14" y2="59" stroke="#18151F" strokeWidth="2" />
                <line x1="44" y1="47" x2="44" y2="57" stroke="#625D69" strokeWidth="1.5" />
                <line x1="74" y1="45" x2="74" y2="59" stroke="#18151F" strokeWidth="2" />
                <circle cx="29" cy="52" r="5" fill="#FF555A" />
                <text x="14" y="32" fontFamily="Instrument Sans, system-ui, sans-serif" fontSize="18" fontWeight="500" fill="#5925A8">
                  3 + 4
                </text>
              </svg>
            </span>
            <div>
              <h3>NAPLAN-style practice &amp; papers</h3>
              <p>Numeracy, Reading and Language conventions.</p>
              <div className="mm-pcard__meta">
                <span className="mm-badge mm-badge--live">
                  <IconCheck />
                  Available
                </span>
                <span className="mm-tag">Year 3</span>
                <span className="mm-tag">3 subjects</span>
              </div>
            </div>
          </Link>

          <Link className="mm-pcard" href="/student/practice">
            <span className="mm-pcard__art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <rect width="88" height="88" fill="#FCFBF8" />
                <line x1="16" y1="68" x2="72" y2="68" stroke="#18151F" strokeWidth="2" />
                <rect x="22" y="44" width="12" height="24" fill="#C9B6E4" stroke="#5925A8" strokeWidth="1.5" />
                <rect x="38" y="30" width="12" height="38" fill="#5925A8" opacity="0.5" stroke="#5925A8" strokeWidth="1.5" />
                <rect x="54" y="52" width="12" height="16" fill="#FFFFFF" stroke="#5925A8" strokeWidth="1.5" />
                <circle cx="60" cy="24" r="6" fill="none" stroke="#FF555A" strokeWidth="2" />
              </svg>
            </span>
            <div>
              <h3>ICAS-style papers</h3>
              <p>Maths, Reading, Language, Science, Digital Technologies and Spelling — all six open for Year 3.</p>
              <div className="mm-pcard__meta">
                <span className="mm-badge mm-badge--live">
                  <IconCheck />
                  Available
                </span>
                <span className="mm-tag">Year 3</span>
                <span className="mm-tag">6 subjects</span>
              </div>
            </div>
          </Link>

          <Link className="mm-pcard" href="/student/learn">
            <span className="mm-pcard__art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <rect width="88" height="88" fill="#FCFBF8" />
                <line x1="20" y1="26" x2="68" y2="26" stroke="#5925A8" strokeWidth="2" />
                <line x1="20" y1="38" x2="60" y2="38" stroke="#C9B6E4" strokeWidth="2" />
                <line x1="20" y1="50" x2="66" y2="50" stroke="#C9B6E4" strokeWidth="2" />
                <line x1="20" y1="62" x2="48" y2="62" stroke="#C9B6E4" strokeWidth="2" />
                <path d="M54 62 L60 68 L72 54" fill="none" stroke="#0B6B63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <h3>Curriculum lessons</h3>
              <p>Maths and English. Each lesson has a worked example, a common trap and 4–5 questions.</p>
              <div className="mm-pcard__meta">
                <span className="mm-badge mm-badge--live">
                  <IconCheck />
                  Available
                </span>
                <span className="mm-tag">Year 3</span>
                <span className="mm-tag">54 lessons</span>
                <span className="mm-tag">15 min each</span>
              </div>
            </div>
          </Link>

          <Link className="mm-pcard" href="/student/practice">
            <span className="mm-pcard__art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <rect width="88" height="88" fill="#FCFBF8" />
                <line x1="18" y1="30" x2="70" y2="30" stroke="#C9B6E4" strokeWidth="2" />
                <circle cx="54" cy="30" r="6" fill="#FFFFFF" stroke="#5925A8" strokeWidth="2" />
                <line x1="18" y1="46" x2="70" y2="46" stroke="#C9B6E4" strokeWidth="2" />
                <circle cx="32" cy="46" r="6" fill="#FFFFFF" stroke="#5925A8" strokeWidth="2" />
                <line x1="18" y1="62" x2="70" y2="62" stroke="#C9B6E4" strokeWidth="2" />
                <circle cx="62" cy="62" r="6" fill="#FFFFFF" stroke="#FF555A" strokeWidth="2" />
              </svg>
            </span>
            <div>
              <h3>Build your own practice</h3>
              <p>Pick the subject, how many questions and whether it&apos;s timed.</p>
              <div className="mm-pcard__meta">
                <span className="mm-badge mm-badge--live">
                  <IconCheck />
                  Available
                </span>
                <span className="mm-tag">Year 3</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="mm-pcard mm-pcard--planned" style={{ marginTop: 18, gridTemplateColumns: "1fr" }}>
          <div>
            <h3>Coming later</h3>
            <p>
              Singapore Maths, AMC-style, Olympiad-style, Selective-entry-style and Scholarship-style are being built. There are no questions in them yet, so they don&apos;t appear in Practice Studio or the Exam Centre.
            </p>
            <div className="mm-pcard__meta">
              <span className="mm-badge mm-badge--planned">
                <IconClock />
                Planned
              </span>
              <span className="mm-tag">5 pathways</span>
              <span className="mm-tag">Year levels to be confirmed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Help nudge */}
      <section
        className="mm-card mm-only-sm"
        style={{
          marginTop: 20,
          background: "var(--mm-tint)",
          boxShadow: "none",
          border: "1px solid rgba(89,37,168,.14)",
        }}
      >
        <h2 style={{ fontSize: 19 }}>New here?</h2>
        <p className="mm-small" style={{ marginTop: 6, color: "var(--mm-ink-soft)" }}>
          The Help Centre has a two-minute tour, and how to ask a grown-up for help with your account.
        </p>
        <Link className="mm-btn mm-btn--outline mm-btn--block" href="/student/support" style={{ marginTop: 14 }}>
          <NavIconHelp />
          Open the Help Centre
        </Link>
      </section>
    </>
  );
}

export function LoadingMySpaceContent() {
  return (
    <>
      <p className="mm-sr" id="ld-live" role="status">
        Loading My Space
      </p>

      <div className="mm-greet">
        <div>
          <div className="mm-skel" style={{ width: 132, height: 13 }} />
          <div className="mm-skel" style={{ width: 320, height: 40, marginTop: 12 }} />
          <div className="mm-skel" style={{ width: 430, height: 15, marginTop: 14 }} />
        </div>
        <div className="mm-hide-sm" style={{ minWidth: 252 }}>
          <div className="mm-skel" style={{ width: 160, height: 12 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginTop: 10 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="mm-skel" style={{ height: 36, borderRadius: 10 }} />
            ))}
          </div>
        </div>
      </div>

      <div className="mm-grid--actions">
        <div className="mm-starthere">
          <div className="mm-starthere__body">
            <div className="mm-skel" style={{ width: 184, height: 12 }} />
            <div className="mm-skel" style={{ width: 290, height: 30, marginTop: 16 }} />
            <div className="mm-skel" style={{ width: 330, height: 14, marginTop: 14 }} />
            <div style={{ marginTop: 24, maxWidth: 380 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div className="mm-skel" style={{ width: 120, height: 13 }} />
                <div className="mm-skel" style={{ width: 100, height: 13 }} />
              </div>
              <div className="mm-skel" style={{ height: 4, borderRadius: 4, marginTop: 12 }} />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 26 }}>
              <div className="mm-skel" style={{ width: 184, height: 52, borderRadius: 12 }} />
              <div className="mm-skel" style={{ width: 124, height: 52, borderRadius: 12 }} />
            </div>
          </div>
          <div className="mm-starthere__art">
            <div className="mm-skel" style={{ width: "100%", height: "100%", borderRadius: 0 }} />
          </div>
        </div>

        <div className="mm-card" style={{ display: "grid", gap: 16 }}>
          <div>
            <div className="mm-skel" style={{ width: 150, height: 22 }} />
            <div className="mm-skel" style={{ width: 230, height: 13, marginTop: 10 }} />
          </div>
          <div
            style={{
              background: "var(--mm-tint-soft)",
              border: "1px solid var(--mm-line)",
              borderRadius: "var(--radius-card)",
              padding: 18,
            }}
          >
            <div className="mm-skel" style={{ width: 120, height: 12 }} />
            <div className="mm-skel" style={{ width: 190, height: 16, marginTop: 10 }} />
            <div className="mm-skel" style={{ width: "100%", height: 13, marginTop: 10 }} />
            <div className="mm-skel" style={{ width: "76%", height: 13, marginTop: 6 }} />
            <div className="mm-skel" style={{ width: "100%", height: 48, borderRadius: 12, marginTop: 16 }} />
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <div className="mm-skel" style={{ width: "100%", height: 48, borderRadius: 12 }} />
            <div className="mm-skel" style={{ width: "100%", height: 48, borderRadius: 12 }} />
          </div>
        </div>
      </div>

      <div className="mm-card" style={{ marginTop: 24 }}>
        <div className="mm-skel" style={{ width: 184, height: 22 }} />
        <div className="mm-skel" style={{ width: 340, height: 13, marginTop: 10 }} />
        <div style={{ marginTop: 16 }}>
          {[
            ["56%", "36%"],
            ["64%", "44%"],
            ["48%", "32%"],
          ].map(([w1, w2], idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "40px minmax(0,1fr) 150px",
                gap: 14,
                alignItems: "center",
                padding: "14px 0",
                borderBottom: idx < 2 ? "1px solid var(--mm-line-soft)" : undefined,
              }}
            >
              <div className="mm-skel" style={{ width: 40, height: 40, borderRadius: 10 }} />
              <div style={{ display: "grid", gap: 7 }}>
                <div className="mm-skel" style={{ width: w1, height: 14 }} />
                <div className="mm-skel" style={{ width: w2, height: 12 }} />
              </div>
              <div className="mm-skel" style={{ width: 140, height: 44, borderRadius: 12 }} />
            </div>
          ))}
        </div>
      </div>

      <div className="mm-card" style={{ marginTop: 32 }}>
        <div className="mm-skel" style={{ width: 150, height: 22 }} />
        <div className="mm-skel" style={{ width: 480, height: 13, marginTop: 10 }} />
        <div className="mm-grid--progress" style={{ marginTop: 22 }}>
          <div style={{ display: "grid", gap: 14 }}>
            {[
              [88, 112],
              [100, 112],
              [184, 104],
              [196, 96],
            ].map(([w1, w2], idx) => (
              <div key={idx}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div className="mm-skel" style={{ width: w1, height: 13 }} />
                  <div className="mm-skel" style={{ width: w2, height: 13 }} />
                </div>
                <div className="mm-skel" style={{ height: 6, borderRadius: 99, marginTop: 8 }} />
              </div>
            ))}
          </div>
          <div
            style={{
              background: "var(--mm-tint-soft)",
              border: "1px solid var(--mm-line)",
              borderRadius: "var(--radius-card)",
              padding: 20,
            }}
          >
            <div className="mm-skel" style={{ width: 132, height: 15 }} />
            <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "20px minmax(0,1fr)", gap: 10 }}>
                <div className="mm-skel" style={{ width: 18, height: 18, borderRadius: 5 }} />
                <div style={{ display: "grid", gap: 6 }}>
                  <div className="mm-skel" style={{ width: "100%", height: 13 }} />
                  <div className="mm-skel" style={{ width: "58%", height: 13 }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "20px minmax(0,1fr)", gap: 10 }}>
                <div className="mm-skel" style={{ width: 18, height: 18, borderRadius: 5 }} />
                <div style={{ display: "grid", gap: 6 }}>
                  <div className="mm-skel" style={{ width: "100%", height: 13 }} />
                  <div className="mm-skel" style={{ width: "72%", height: 13 }} />
                </div>
              </div>
            </div>
            <div className="mm-skel" style={{ width: "100%", height: 48, borderRadius: 12, marginTop: 20 }} />
          </div>
        </div>
      </div>

      <p className="mm-caption" style={{ marginTop: 24 }}>
        Skeleton blocks match the finished layout so nothing jumps when the data lands.{" "}
        <code style={{ fontFamily: "ui-monospace,monospace", fontSize: 13 }}>prefers-reduced-motion</code> removes the shimmer. The shell, navigation and Help Centre are usable while the content loads.
      </p>
    </>
  );
}

function EmptyErrorMySpaceContent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <div>
        <p className="mm-eyebrow">System states</p>
        <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-.034em", lineHeight: 1.1, marginTop: 8 }}>
          Empty and error
        </h1>
        <p className="mm-small" style={{ marginTop: 10, maxWidth: "64em" }}>
          Every state says what is there, why, and the one thing to do next. No state ever invents progress to fill a gap, and no state blames the student for a quiet week.
        </p>
      </div>

      <section aria-labelledby="s-empty">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 id="s-empty" className="mm-section-title" style={{ fontSize: 21 }}>
            Empty — returning student, nothing to show in a section
          </h2>
          <span className="mm-badge mm-badge--neutral">Dashed quiet card · one action</span>
        </div>

        <div className="mm-grid mm-grid--2" style={{ marginTop: 18, alignItems: "start" }}>
          <div>
            <p className="mm-caption" style={{ marginBottom: 8 }}>
              1 · Nothing unfinished — the Continue card becomes a start card
            </p>
            <section className="mm-card" aria-labelledby="e1">
              <p className="mm-eyebrow">Ready when you are</p>
              <h3 id="e1" style={{ fontSize: 22, marginTop: 8 }}>
                Nothing in progress
              </h3>
              <p className="mm-small" style={{ marginTop: 8 }}>
                You finished everything you started. A new set takes about 12 minutes.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
                <Link className="mm-btn mm-btn--primary" href="/student/practice">
                  Start practice
                </Link>
                <Link className="mm-btn mm-btn--outline" href="/student/learn">
                  Read a lesson
                </Link>
              </div>
            </section>
          </div>

          <div>
            <p className="mm-caption" style={{ marginBottom: 8 }}>
              2 · No unseen questions for the weakest skill — the drill is withheld, not disabled
            </p>
            <section className="mm-card" aria-labelledby="e2">
              <h3 id="e2">Start practice</h3>
              <div className="mm-card mm-card--quiet" style={{ marginTop: 14, padding: 18, borderRadius: 14 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span
                    className="mm-li__ic"
                    style={{ width: 36, height: 36, flexShrink: 0, background: "var(--mm-track)", color: "var(--mm-muted)" }}
                  >
                    <IconCheck />
                  </span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15 }}>No new statistics questions yet</p>
                    <p className="mm-small" style={{ marginTop: 4 }}>
                      You&apos;ve answered all 9 we have for this strand. We&apos;ll add more. Nothing is suggested until there&apos;s something unseen to practise.
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                <Link className="mm-btn mm-btn--outline mm-btn--block" href="/student/practice">
                  Choose another topic
                </Link>
                <Link className="mm-btn mm-btn--ghost mm-btn--block" href="/student/practice">
                  Build your own set
                </Link>
              </div>
            </section>
          </div>

          <div>
            <p className="mm-caption" style={{ marginBottom: 8 }}>
              3 · Marked work empty, lessons read — the distinction is stated
            </p>
            <section className="mm-card" aria-labelledby="e3">
              <h3 id="e3">My progress</h3>
              <div className="mm-state" style={{ marginTop: 16, gap: 10 }}>
                <span className="mm-li__ic" style={{ width: 44, height: 44 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 20, height: 20 }}>
                    <path d="M3 3v18h18" />
                    <path d="M7 16v-4" />
                    <path d="M12 16V9" />
                    <path d="M17 16v-7" />
                  </svg>
                </span>
                <p style={{ fontWeight: 600, fontSize: 16 }}>No marked work yet</p>
                <p className="mm-small">
                  You&apos;ve read 3 lessons — well done. Lessons aren&apos;t marked, so there&apos;s nothing to chart until you finish a practice set or a test.
                </p>
                <Link className="mm-btn mm-btn--outline mm-btn--sm" href="/student/practice" style={{ marginTop: 4 }}>
                  Start a practice set
                </Link>
              </div>
            </section>
          </div>

          <div>
            <p className="mm-caption" style={{ marginBottom: 8 }}>
              4 · A year level with nothing open — planned pathways are never dressed as available
            </p>
            <section className="mm-card" aria-labelledby="e4">
              <h3 id="e4">Open for Year 4</h3>
              <div className="mm-state" style={{ marginTop: 16, gap: 10 }}>
                <span className="mm-li__ic" style={{ width: 44, height: 44, background: "var(--mm-track)", color: "var(--mm-muted)" }}>
                  <IconClock />
                </span>
                <p style={{ fontWeight: 600, fontSize: 16 }}>Nothing is open for Year 4 yet</p>
                <p className="mm-small">
                  Years 3 and 5 are open now. You can still practise any open Year 3 or Year 5 set, or read a lesson.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
                  <Link className="mm-btn mm-btn--outline mm-btn--sm" href="/student/learn">
                    See Year 3
                  </Link>
                  <Link className="mm-btn mm-btn--outline mm-btn--sm" href="/student/learn">
                    See Year 5
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section aria-labelledby="s-error">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 id="s-error" className="mm-section-title" style={{ fontSize: 21 }}>
            Error
          </h2>
          <span className="mm-badge mm-badge--neutral">What failed · whether work is safe · what to do</span>
        </div>
        <p className="mm-small" style={{ marginTop: 6, maxWidth: "64em" }}>
          A student&apos;s first worry is losing their work, so every error answers that before anything else. Section errors leave the rest of the page usable.
        </p>

        <div style={{ display: "grid", gap: 20, marginTop: 18 }}>
          <div>
            <p className="mm-caption" style={{ marginBottom: 8 }}>
              5 · One section failed — the rest of My Space still works
            </p>
            <section className="mm-card" aria-labelledby="e5">
              <h3 id="e5">Recent results</h3>
              <div className="mm-banner mm-banner--error" role="alert" style={{ marginTop: 14 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
                <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                  <b style={{ fontWeight: 600 }}>We couldn&apos;t load your results just now.</b>
                  <span style={{ display: "block", marginTop: 2 }}>
                    Nothing has been lost — your marks and answers are saved. This is a problem on our side.
                  </span>
                  <button className="mm-btn mm-btn--outline mm-btn--sm" type="button" style={{ marginTop: 12 }}>
                    Try again
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}

export function MySpaceCanvasScreen({ state }: { state: MySpaceCanvasState }) {
  const isFirstVisit = state === "first-visit";
  const isLoading = state === "loading";
  const studentName = isFirstVisit ? "Aisha R." : "Kiran M.";
  const studentInitial = isFirstVisit ? "A" : "K";
  const yearLevel = isFirstVisit ? 3 : 5;

  return (
    <StudentCanvasShell
      active="home"
      title="My Space"
      studentName={studentName}
      studentInitial={studentInitial}
      yearLevel={yearLevel}
      isFirstVisit={isFirstVisit}
      isLoading={isLoading}
      boxedHelpIcon={state === "resume"}
    >
      {state === "resume" && <ReturningMySpaceContent />}
      {state === "no-resume" && <NoResumeMySpaceContent />}
      {state === "first-visit" && <FirstVisitMySpaceContent />}
      {state === "loading" && <LoadingMySpaceContent />}
      {state === "empty-error" && <EmptyErrorMySpaceContent />}
    </StudentCanvasShell>
  );
}
