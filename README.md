# QA Automation Challenge — DemoBlaze

End-to-end test automation for [DemoBlaze](https://www.demoblaze.com/), built with
**Playwright + TypeScript** using the Page Object Model.

The suite covers **UI, API, regression and performance** testing, runs across
**five browser/viewport targets**, and executes unattended in **GitHub Actions**.

| | |
|---|---|
| **Test cases documented** | 84 (delivered as the Excel workbook, submitted separately) |
| **Automated** | 78 of 84 (93%) |
| **Automated tests** | 67 across 6 spec files (79 executions across the 7 projects) |
| **Defects found** | 13, including 1 critical and 4 high |
| **Tagged** | 5 `@smoke`, 63 `@regression`, 11 `@known-defect` |

---

## 1. Quick start

```bash
npm ci
npm run install:browsers      # playwright install --with-deps
cp .env.example .env          # defaults already target the challenge account

npm test                      # everything
npm run test:smoke            # critical paths only (~2 min)
npm run report                # open the HTML report
```

---

## 2. Deliverables

| Deliverable | Where |
|---|---|
| Test case suite (Excel) | `QA Automation Challenge.xlsx` — submitted separately (not committed to this repo); 84 cases across Login, Cart, API and Non-Functional sheets, plus a defect log and a summary sheet |
| Automation framework | this repository |
| Demo scripts (login → add to cart → place order) | [`tests/ui/checkout.spec.ts`](tests/ui/checkout.spec.ts) (`E2E-001`) |
| Documentation | this README |

---

## 3. Framework structure

```
config/
  env.ts                  .env loading, base URLs, credentials, performance budgets
api/
  DemoBlazeApi.ts         typed client for api.demoblaze.com
data/
  products.ts             product fixtures (id, title, price, category)
  orders.ts               order payloads and edge-case strings
pages/
  BasePage.ts             shared nav bar, alert capture, modal waits
  HomePage.ts             product catalogue
  LoginPage.ts            login modal
  SignUpPage.ts           sign-up modal
  ProductPage.ts          product detail page
  CartPage.ts             cart table and Place Order modal
fixtures/
  test-fixtures.ts        page objects, API client, isolated test accounts
utils/
  performance.ts          Performance Timeline helpers
tests/
  ui/login.spec.ts        19 login / session / security tests
  ui/cart.spec.ts         23 cart and checkout-validation tests
  ui/checkout.spec.ts     the end-to-end purchase demo
  api/auth.api.spec.ts    13 auth and sign-up contract tests
  api/products.api.spec.ts 7 catalogue contract tests
  perf/performance.spec.ts 4 latency budget checks
.github/workflows/        CI pipeline
```

### Why it is laid out this way

**Page Object Model, with a `BasePage`.** Selectors live in exactly one place, so
a DOM change is a one-line edit rather than a search across specs. The navigation
bar appears on every DemoBlaze route, so it belongs on a shared base class
together with the two site-wide mechanics every page needs: capturing native
`alert()` dialogs and waiting out Bootstrap modal animations.

**Fixtures instead of constructors in specs.** `fixtures/test-fixtures.ts`
exposes each page object, the API client and test accounts. A spec declares what
it needs (`async ({ cartPage, api }) => …`) and gets it already built. Adding a
page object is one line there, not an edit to every spec.

**Test data is separated from test logic.** `data/products.ts` holds prices that
the UI assertions depend on, and `API-014` asserts those fixtures against the
live catalogue. If DemoBlaze changes a price, one API test fails with a clear
message instead of every cart test failing on a confusing total mismatch.

**A typed API client.** `api/DemoBlazeApi.ts` returns the raw `APIResponse`
rather than a parsed body, because this API has cases where the status code and
the body disagree — hiding that would hide real defects (see `DEFECT-007`).

**Tags drive selection, not file layout.** Every test carries `@ui`/`@api`/`@perf`
plus `@smoke`, `@regression` or `@known-defect`, so CI and developers can slice
the suite by intent (`npm run test:smoke`) without reorganising files.

---

## 4. Test types

| Type | Location | What it does |
|---|---|---|
| **UI** | `tests/ui/` | Full user journeys through the browser. Functional, edge and negative paths for Login and Cart. |
| **API** | `tests/api/` | Contract and negative tests straight against `api.demoblaze.com`. Fast, and catches faults the UI hides behind client-side validation. |
| **Regression** | `@regression` tag | Every UI and API test. This is the gate for a release. |
| **Smoke** | `@smoke` tag | The critical paths — login, add to cart, end-to-end purchase. Runs on all five browser targets. |
| **Performance** | `tests/perf/` | Page-load and endpoint latency budgets, read from the browser's Performance Timeline so Playwright's own overhead is excluded. Budgets are configurable per environment. |

---

## 5. Cross-browser and cross-platform coverage

| Project | Target | Scope |
|---|---|---|
| `api` | none (HTTP only) | all API tests |
| `ui-chromium` | Desktop Chrome | **full** UI regression |
| `ui-firefox` | Desktop Firefox | `@smoke` |
| `ui-webkit` | Desktop Safari | `@smoke` |
| `ui-mobile-chrome` | Pixel 7 viewport | `@smoke` |
| `ui-mobile-safari` | iPhone 14 viewport | `@smoke` |
| `perf` | Desktop Chrome | latency budgets |

Running the *whole* suite five times against a shared public demo app would be
slow and would hammer a host we do not own, for little extra signal. Full depth
runs on one engine; the critical paths run everywhere. Any project can still be
widened in one line — `grep: /@smoke/` is the only thing limiting them.

```bash
npm run test:cross-browser    # chromium + firefox + webkit
npm run test:mobile           # both mobile viewports
```

---

## 6. Configuration

Everything environment-specific comes from `.env`, loaded by `config/env.ts`.
Real environment variables always win, so CI injects secrets without a file.
`.env` is git-ignored; `.env.example` is the committed template.

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | `https://www.demoblaze.com` | Application under test |
| `API_BASE_URL` | `https://api.demoblaze.com` | API under test |
| `DEMOBLAZE_USERNAME` | `ChallengeUser` | Account for the login tests |
| `DEMOBLAZE_PASSWORD` | `ChallengeUser` | Password for that account |
| `PERF_HOME_LOAD_MS` | `10000` | Page-load budget |
| `PERF_FCP_MS` | `6000` | First Contentful Paint budget |
| `PERF_DCL_MS` | `8000` | DOMContentLoaded budget |
| `PERF_API_MS` | `3000` | API response budget |
| `IGNORE_SYSTEM_PROXY` | unset | Set to `1` if a stale OS proxy breaks local Firefox runs |

---

## 7. Reporting

Three reporters run together:

- **`list`** — readable console output.
- **`html`** — full report with traces, screenshots, videos and the attached
  performance metrics. `npm run report`.
- **`junit`** — `test-results/junit.xml`, for CI test-result dashboards.

On failure the suite captures a **screenshot**, a **video**, and on the first
retry a **Playwright trace** (`npx playwright show-trace <trace.zip>`) with the
full DOM, network log and a step-by-step timeline.

---

## 8. Running the tests

```bash
npm test                   # all projects
npm run test:ui            # full UI regression (chromium)
npm run test:api           # API only
npm run test:perf          # performance budgets
npm run test:smoke         # @smoke across all browsers
npm run test:regression    # @regression
npm run test:known-defects # only the tests that pin known defects
```

### Watching it run

```bash
npm run test:headed        # visible browser
npm run test:uimode        # Playwright UI mode — best for debugging
npm run test:debug         # Playwright Inspector, step by step
```

Headed runs need a display; on a headless machine use `xvfb-run`.
To make it permanent, set `headless: !!process.env.CI` in the `use` block of
`playwright.config.ts` so CI stays headless.

---

## 9. CI/CD

[`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) runs on
every push and pull request to `main`, and on demand via *Run workflow*.

The pipeline is split into three jobs so failures are easy to read:

1. **`api-tests`** — no browsers to install, so it finishes in under a minute and
   fails fast on a broken contract.
2. **`ui-tests`** — a matrix over the five browser/viewport projects, so one
   engine failing does not mask the others.
3. **`performance-tests`** — latency budgets, non-blocking
   (`continue-on-error`) because a shared demo host's latency is not the team's
   defect to fix.

Each job uploads its HTML report and JUnit XML as artifacts, retained 30 days.

Credentials come from repository secrets `DEMOBLAZE_USERNAME` /
`DEMOBLAZE_PASSWORD`, falling back to the public challenge account so the
pipeline is green on a fresh clone.

---

## 10. Test isolation — the one thing worth reading

DemoBlaze stores the cart **server-side against the account**, not the browser
session. Two findings, both discovered while building this suite:

- **Anonymous visitors all share one cart.** An anonymous page sends an empty
  cart id, so every anonymous visitor reads and writes the *same* server-side
  cart. Running the cart tests anonymously made them read **28+ rows** left
  behind by unrelated sessions (`DEFECT-012`).
- **A logged-in cart is shared by every session of that account.** A fresh
  browser context logging in as the same user sees the previous session's items
  (`DEFECT-010`).

Verified directly: account A adds an item, account B sees an empty cart, and
account A in a brand-new context sees A's item.

So a single shared test account cannot give any test a clean cart. The
`signedIn` fixture therefore **registers a throwaway account per test** through
the sign-up API, then puts the browser in a signed-in state by **seeding the
session cookie from an API login** rather than driving the login form.

Two benefits:

- **Isolation** — every cart test starts from a genuinely empty cart.
- **Weight** — driving the login UI in all 23 cart tests would re-test login 23
  times for no extra coverage, and those extra page loads are by themselves
  enough to get throttled by this shared host. The login *UI* is covered where
  it belongs: the login suite, and the `E2E-001` demo flow.

This is the sort of constraint that only surfaces by probing the application, and
it is why the framework is shaped the way it is.

---

## 11. Handling known defects

13 defects were reproduced (full detail in the workbook's **Defects** sheet).
Tests that cover them are tagged **`@known-defect`** and assert the *current*
behaviour, with a comment naming the defect:

```ts
test('CART-021: completes a purchase from an empty cart for 0 USD',
  { tag: '@known-defect' }, async ({ signedIn, cartPage }) => {
    // DEFECT-001: an empty cart should not be purchasable at all, yet the
    // app confirms an order for 0 USD.
    expect(CartPage.parseConfirmedAmount(confirmation)).toBe(0);
```

The pipeline stays green, the defect stays visible in every report, and if the
application is ever fixed the test fails and forces the expectation to be
updated. `npm run test:known-defects` lists them all.

### The highest-impact finding

`DEFECT-008` — the session token is `base64("<username>" + a small global
counter)`:

```
Auth_token: Q2hhbGxlbmdlVXNlcjE3OTE3MTE=  →  ChallengeUser1791711
```

It discloses the account name, and because the counter is small and increments
globally, **a token for any known username can be forged** by trying nearby
values. Covered by `API-018`.

---

## 12. Stability against a shared demo app

DemoBlaze is public, slow under load and throttles bursts of traffic. The suite
is written for that:

- Bootstrap modals are awaited via their `show` class, not just input
  visibility, so clicks and typing cannot land on a fading backdrop.
- Native `alert`s are **accepted the moment they open**, not parked on a
  pending `waitForEvent('dialog')`. DemoBlaze raises some alerts
  *synchronously inside the click handler* — the order form's "Please fill out
  Name and Creditcard." and the empty-login check both do — and a click that
  opens a dialog nobody accepts never resolves, so the click times out instead
  of the assertion running. `BasePage.captureAlert` resolves the message
  through a promise so it works whichever way round the two events land.
- `CartPage.verifyItemInCart` retries with a reload, because the cart renders
  from an async call that sometimes resolves after first paint.
- The login XHR is awaited explicitly, so a dropped request fails with a clear
  message instead of an unexplained missing greeting.
- **The suite runs serially (`workers: 1`).** This is deliberate. With parallel
  workers, DemoBlaze starts shedding load: `net::ERR_CONNECTION_CLOSED`, TLS
  sockets disconnecting mid-handshake and 30-second click timeouts — failures
  that look like test bugs but are really the host throttling. One worker keeps
  the request rate civil and the results trustworthy. In CI each browser project
  is a separate runner, so wall-clock time stays reasonable.
- Sessions are seeded through the API rather than the login form wherever login
  is not the thing under test (see section 10), which cuts two page loads per
  cart test.
- Generous timeouts, plus 1 retry locally and 2 in CI, absorb the remaining
  stalls.
