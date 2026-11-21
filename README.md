# Toolshop Test Automation (Playwright + TypeScript)

Automated UI, end-to-end and API tests for the [Toolshop demo app](https://practicesoftwaretesting.com).

- 18 functional test cases (TC-01 to TC-18) - 7 positive, 7 negative, 4 edge
- 14 end-to-end scenarios (E2E-01 to E2E-14) - full customer journey and every payment method
- Test design, strategy and tool-selection rationale: `Test-Design.xlsx` (repo root) and `docs/test-cases.md`

## Prerequisites

- [Node.js](https://nodejs.org) 18 or newer (includes npm) - check with `node -v`
- [Git](https://git-scm.com)
- Internet access (tests run against the public demo site)

## Installation

```powershell
git clone <your-repo-url>
cd <repo-folder>
npm ci                      # installs dependencies (use `npm install` if npm ci fails)
npx playwright install      # downloads the browsers
```

## Configuration

1. Copy the example environment file:
   ```powershell
   copy .env.example .env        # macOS/Linux: cp .env.example .env
   ```
2. Edit `.env`:
   | Variable | Purpose |
   |---|---|
   | `TOOLSHOP_USERNAME` / `TOOLSHOP_PASSWORD` | A registered demo customer (used by TC-05 and TC-06) |
   | `BASE_URL` | UI address (default `https://practicesoftwaretesting.com`) |
   | `API_URL` | API address (default `https://api.practicesoftwaretesting.com`) |
3. Never commit `.env`.

The registration, checkout and E2E tests create their own unique users, so they need no account.

## Running the tests

```powershell
npm test                                   # all tests
npx playwright test --grep @e2e            # only the 14 end-to-end scenarios
npx playwright test --grep @video          # the two live-coding cases (TC-05, TC-06)
npx playwright test --grep @P1             # priority 1 tests
npx playwright test --grep @positive       # also @negative, @edge
npx playwright test tests/cart/cart.spec.ts   # one spec file
npm run test:headed                        # watch the browser
npm run test:ui                            # Playwright UI mode
npm run test:debug                         # step-by-step debugger
npm run report                             # open the HTML report of the last run
npm run typecheck                          # TypeScript check
```

To write the console output to `test-run.log`, use `npm run test:log` (all tests) or `npm run test:video:log` (video cases).

Tests run one at a time (`workers: 1`) with one retry, because the demo site is shared. Failures keep a screenshot, and the retry keeps a trace, in `test-results/`.

## Project structure

```
tests/
  login/                 TC-01..06   register, login, logout, E2E shopping flow
  product-search-filter/ TC-07..09   category filter, search edge cases
  cart/                  TC-10..12   quantity update and limits
  checkout-payment/      TC-13..17   guest checkout, card, cash, expiry
  api/                   TC-18       invalid login / unknown product
  e2e/                   E2E-01..14  customer journey and payment methods
pages/                   Page Objects (Header, Products, Cart, Checkout, ...)
fixtures/                Custom Playwright fixtures (registered user, API helper, ...)
utils/                   Shared flows, API helper, money parser, auth helper
data/test-data.ts        Central test data (cards, addresses, search terms, ...)
docs/test-cases.md       Test case document
```

## Notes

- The demo site is a public training app. Its data and behaviour can change, so an occasional failure may come from the site itself - re-run before investigating.
- Payment data used (card `1111-1111-1111-1111`, gift card, bank details) is dummy data.
- Tags: `@P1/@P2/@P3` (priority), `@positive/@negative/@edge` (type), `@e2e`, `@video`, `@automated`.
