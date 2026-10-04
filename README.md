# QA Automation Challenge

UI test automation for the [DemoBlaze](https://www.demoblaze.com/) demo shop, built with
[Playwright](https://playwright.dev/) and TypeScript using the Page Object Model.

## Coverage

| ID | Test | Spec |
| --- | --- | --- |
| TC_LOG_001 | Login with valid credentials | `tests/login.spec.ts` |
| TC_LOG_002 | Login with a wrong password shows an alert and keeps the user signed out | `tests/login.spec.ts` |
| TC_LOG_003 | Login with an unknown user shows an alert | `tests/login.spec.ts` |
| TC_E2E_001 | Logged-in user adds a product to the cart and completes checkout | `tests/checkout.spec.ts` |

Every spec runs against Chromium, Firefox and WebKit.

## Setup

```bash
npm ci
npm run install:browsers   # playwright install --with-deps
cp .env.example .env       # then review the values
```

## Configuration

Credentials and the target URL come from the environment, loaded from `.env` by
`config/env.ts`. `.env` is git-ignored; `.env.example` is the committed template.
Real environment variables always win over `.env`, so CI can inject secrets.

| Variable | Default | Purpose |
| --- | --- | --- |
| `BASE_URL` | `https://www.demoblaze.com` | Application under test |
| `DEMOBLAZE_USERNAME` | `ChallengeUser` | Account used by the login and checkout specs |
| `DEMOBLAZE_PASSWORD` | `ChallengeUser` | Password for that account |
| `IGNORE_SYSTEM_PROXY` | unset | Set to `1` if a stale OS proxy makes local Firefox runs fail with `NS_ERROR_PROXY_CONNECTION_REFUSED` |

## Running the tests

```bash
npm test                 # all browsers
npm run test:chromium    # single browser
npm run test:headed      # watch it run in Chromium
npm run test:ui          # Playwright UI mode
npm run report           # open the last HTML report
```

### Running with a visible browser (headless: false)

Tests run headless by default. To watch them, pass `--headed` rather than
editing the config, so CI stays headless:

```bash
npm run test:headed                                    # chromium, visible
npx playwright test --headed                           # all browsers, visible
npx playwright test --project=chromium --headed        # one browser
npx playwright test tests/checkout.spec.ts --headed    # one spec
npx playwright test --headed --workers=1               # one window at a time
```

Add `--workers=1` if you want to follow along, otherwise several browser
windows open at once and race past each other.

For debugging, these beat plain headed mode because they also show the DOM
snapshot at each step:

```bash
npm run test:ui                                        # time-travel UI mode
npx playwright test tests/checkout.spec.ts --debug     # Playwright Inspector
npx playwright test --headed --workers=1 --slow-mo=500 # 500ms between actions
```

To make it permanent, set `headless` in the shared `use` block of
`playwright.config.ts` — keyed off `CI` so the pipeline still runs headless:

```ts
use: {
  headless: !!process.env.CI,
}
```

Headed runs need a display (`DISPLAY` or a Wayland session); on a headless
machine, run them under `xvfb-run`.

## Layout

```
config/env.ts            # .env loading, credentials, base URL
pages/HomePage.ts        # catalogue + shared navigation bar
pages/LoginPage.ts       # login modal, alert handling, session assertions
pages/ProductPage.ts     # product detail page, add to cart
pages/CartPage.ts        # cart contents, order modal, purchase confirmation
tests/login.spec.ts      # authentication suite
tests/checkout.spec.ts   # end-to-end purchase workflow
```

## Notes on stability

DemoBlaze is a shared public demo app, so the suite is written defensively:

- Bootstrap modals are awaited via their `show` class, not just input visibility,
  so clicks and typing cannot land on the fading backdrop.
- Native `alert` dialogs are captured by arming the handler *before* the click
  that triggers them, and their text is asserted.
- The cart is rendered from an async API call that occasionally resolves after
  the first paint, so `CartPage.verifyItemInCart` retries with a reload.
- The login XHR is awaited explicitly, so a dropped request gives a clear failure.
- One retry locally and two on CI absorb the demo site's occasional slow responses.

## CI

`.github/workflows/playwright.yml` runs the full suite on every push and pull
request to `main`/`master`, and uploads the HTML report as an artifact.
Set the `DEMOBLAZE_USERNAME` / `DEMOBLAZE_PASSWORD` repository secrets to
override the default challenge account.
