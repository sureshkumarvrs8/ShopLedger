# Repository Guidelines

## Project Structure & Module Organization

This is a small Node.js/Express POS and Khata ledger app. `server.js` wires the Express app and serves `public/`. API handlers are in `routes/`; business logic is in `lib/` (pricing, tax, coupons, orders, inventory, ledger, reports, dates, and JSON storage). `config.js` holds shop, tax, inventory, and coupon settings. `data/db.json` is the local application store. Browser assets live in `public/index.html`, `public/js/`, and `public/css/`. `docs/architecture.svg` diagrams the current request flow. There is no test directory or test suite currently.

## Build, Test, and Development Commands

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs the server at `http://localhost:3000` by default; set `PORT` to override it.
- `npm test` is currently a placeholder that exits with an error; do not treat it as a passing test suite.

There is no build, lint, or formatting script configured.

## Coding Style & Naming Conventions

Match the existing CommonJS JavaScript style: `require()` imports, `module.exports`/`exports`, semicolons, and two-space indentation. Use lower camel case for functions and variables (for example, `computeTotals`) and descriptive lower-case filenames (for example, `pricing.js`). Keep HTTP parsing in route handlers and reusable business rules in `lib/`. Preserve the existing JSON data shape when changing persistence code.

## Testing Guidelines

No framework or coverage requirement is configured. For changes, describe the checks performed and cover relevant behavior manually or add focused automated tests if introducing a test framework. Pricing changes should account for HSN GST slabs, coupon minimums/caps, rounding, and invoice reconciliation; inventory and Khata changes should consider cancellation and credit-limit paths.

## Commit & Pull Request Guidelines

Recent commits use short, imperative, lower-case summaries (for example, “support hsn gst slabs and coupon maxDiscount caps”). Follow that descriptive style. Pull requests should explain the user-visible or data impact, list manual checks or tests, link related issues when available, and include screenshots for UI changes.

## Security & Configuration

Do not commit credentials or real customer data. `config.js` currently contains an admin key and `data/db.json` may contain customer and ledger information; handle both as sensitive and avoid copying production records into examples or tests.
