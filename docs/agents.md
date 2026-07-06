# Agents roadmap

Phase 0 (current) ships the scaffold. The six agents ship in later phases; each will land as an `app/api/agents/<name>/route.ts` handler plus pure logic in `lib/agents/<name>.ts`. All handlers verify `x-cron-secret` against `process.env.CRON_SECRET`.

## Phase 1 — no external APIs

- **Finance agent** — nightly landed-cost recompute. Joins `inventory_lots` + `us_shipments` + `forwarder_shipments` + `exchange_rates` (nearest `rate_date <= purchase_date`). Writes back `landed_cost_usd`, `landed_cost_twd`, unit variants.
- **Exception agent** — scans for stale orders, unmatched forwarder packages, high-risk states → creates rows in `exceptions`.

## Phase 2 — Google Sheets API

- **Forwarder Sync agent** — reads the forwarder's status Google Sheet, upserts into `forwarder_shipments`, attempts to match `us_tracking_number` against `us_shipments`, sets `matched_retailer_order_id` when confident.

## Phase 3 — Gmail + Anthropic

- **Order Intake agent** — polls Gmail for retailer order confirmations, Anthropic extracts structured order data, inserts `retailer_orders` + `order_items`.
- **Vendor Update agent** — polls Gmail for follow-up emails (shipment, delay, cancellation, refund), Anthropic classifies + extracts, writes `vendor_email_updates` and updates parent order status/risk.

## Phase 4 — EasyPost

- **Tracking agent** — creates EasyPost trackers for each shipped US shipment, syncs status/expected delivery back into `us_shipments`.

## Cron schedule (planned, currently commented in `vercel.json`)

| Agent           | Schedule          |
|-----------------|-------------------|
| order-intake    | every 15 min      |
| vendor-update   | every 15 min      |
| tracking        | every 2 hours     |
| forwarder-sync  | every 6 hours     |
| finance         | daily @ 03:00 UTC |
| exception       | every 4 hours     |
