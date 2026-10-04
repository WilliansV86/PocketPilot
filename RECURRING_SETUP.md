# Recurring Payments — Preview rollout

This update adds Planning → Recurring Payments, weekly/monthly/quarterly/yearly scheduled expenses, bank or credit card payment sources, CAD/USD funding summaries for the next 30 days, and Wise transfers with separate actual sent/received amounts.

## Install

1. Apply PocketPilot-recurring-payments.patch in C:\Projects\PocketPilot.
2. Apply prisma/recurring-payments.sql once to the existing pocketpilot database schema. It adds one nullable transaction column and two tables. It does not reset existing data. Do not use db push or reset.
3. Run npm run build -- --webpack. Build generates the updated Prisma client.
4. Commit and push to feature/credit-card-tracker after the build succeeds.

## Preview testing

Use the separate test login and small test account balances. Preview and production use the same database: do not test Wise transfers on your real account while production still has the older transaction-reversal code.

Keep REMINDERS_ENABLED unchanged/off in Preview. Leave RECURRING_ENABLED unset/off there. Vercel does not invoke cron jobs for Preview deployments. The authenticated Record due payments now button processes only the signed-in user's schedules. Add a schedule dated today, process it twice, and verify exactly one expense and one balance change. The first day can be processed manually in Preview; it will be automatic in production once enabled.

Bank schedules deduct the bank balance. Credit card schedules add to debt. Credit card repayments stay manual. Pause stops future processing; resume skips past paused dates. Edit applies to future charges and does not rewrite previous transactions. The occurrence reservation remains after deleting a charge so retries do not recreate a deleted charge. Missed processing catches up with dated entries, up to 24 occurrences per schedule per run. Missing or archived categories, deleted accounts, closed credit cards or changed source currencies block that schedule until corrected.

Create Wise CAD and Wise USD in Accounts to track actual Wise holdings. A same-currency transfer uses equal sent/received amounts; fees are separate. A conversion uses actual total deducted and actual received. Included fees are already reflected in balances; do not deduct them twice. To categorize the fee as an expense, exclude it from the transfer's source amount and record a separate expense. The transfer description/notes retain both currencies and amounts; transfers are excluded from expense budgets and Stats. To correct these special transfers, delete the transaction and record a replacement using the Wise form; deletion restores both original amounts correctly.

## Production activation — after testing

Port this change into the production worktree preserving its production identity/auth configuration. Do not merge the entire Preview branch. The database change is shared and must not be applied again. Enable RECURRING_ENABLED=true in Production only and redeploy. Keep existing REMINDERS_ENABLED and SMTP settings unchanged.

The existing daily authenticated cron route processes recurring expenses independently of email reminders. Its schedule is 16:00 UTC (10 AM Alberta in summer / 9 AM in winter; provider timing can vary). Dates use America/Edmonton. Actual bank autopay is not controlled or verified by PocketPilot. This adds records only. No financial credentials or bank connection is added.

## Validation

Prisma schema validation passed. Five automated tests passed for Alberta dates, monthly/leap-year anchors, unequal-currency reversal, idempotent bank/card processing including deleted entries, and failed-reference/balance rollback. These runner tests use a transactional in-memory fixture, not a live database concurrency test. A unique occurrence key and Serializable database transaction protect actual processing.

Local TypeScript validation found only existing missing Clerk-package errors in the available test environment; the user's full Preview build remains required. Preview UI and the live cron are not deployed or verified by this patch itself.
