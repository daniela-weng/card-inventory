# Setup — AI Inventory Operations System

You will end up with **one Google Sheet** containing 8 tabs, plus a Claude prompt you paste at the start of each work session. Total setup time: ~5 minutes.

---

## Step 1 — Create the Sheet

1. Go to https://sheets.google.com and click **Blank**.
2. Rename it: `Sports Card Inventory Ops` (or whatever you like).

## Step 2 — Paste the setup script

1. In the sheet, click **Extensions → Apps Script**.
2. Delete the default `function myFunction() {}` code.
3. Open `setup.gs` from this folder, copy the entire file, paste it into the Apps Script editor.
4. Click the 💾 save icon (or Ctrl/Cmd+S). Give the project any name.

## Step 3 — Run the builder

1. In the Apps Script editor, at the top there is a function-picker dropdown. Choose **`buildInventorySystem`**.
2. Click **▶ Run**.
3. First run only: Google will ask you to review permissions.
   - Click **Review permissions** → choose your Google account → **Advanced** → **Go to (project name) (unsafe)** → **Allow**.
   - This is normal for scripts you write yourself. The script only touches this one Sheet.
4. Wait ~10 seconds. When done, you'll see a popup: *"Inventory system built."*

## Step 4 — Verify

Return to your Sheet. You should now see these tabs at the bottom:

- **Dashboard** — live counters
- **RetailerOrders** — one row per order
- **OrderItems** — one row per item (an order can have many)
- **USShipments** — one row per US carrier package
- **VendorEmailUpdates** — log of every vendor email
- **ForwarderShipments** — the tab you share with your forwarder
- **InventoryLots** — landed cost + on-hand quantities
- **ExchangeRates** — USD→TWD rate history

An "Inventory Ops" menu also appears in the menu bar with ID generators and a dashboard refresh button. (If you don't see it, reload the tab.)

## Step 5 — First data entry

1. Open the **ExchangeRates** tab. Add today's rate:
   - `rate_date` = today (e.g. `2026-07-05`)
   - `usd_to_twd_rate` = e.g. `32.15`
   - `source` = e.g. `Google Finance` or `Wise`
2. Go to **RetailerOrders** and add one test row:
   - `internal_order_id` — use the "Inventory Ops → Generate new order ID" menu
   - `retailer`, `purchase_date` (matching the rate you added), `total_price_usd`
   - The `exchange_rate_usd_twd` and `total_price_twd` columns should populate automatically.
3. Set `needs_review` = `TRUE` — the row should turn light red. Set back to `FALSE`.

If those work, the system is live.

## Step 6 — Share the ForwarderShipments tab with your forwarder

You do **not** want to give your forwarder access to your order costs. Two options:

**Option A (simplest)** — Protect the other tabs:

1. Right-click each of the 7 non-forwarder tabs → **Protect sheet** → **Set permissions** → **Only you can edit**.
2. Share the whole file with your forwarder as **Editor**. They can only edit ForwarderShipments.

**Option B (cleanest)** — Create a separate sheet just for the forwarder:

1. Make a new Google Sheet called `Forwarder Sync`.
2. In it, use `=IMPORTRANGE("<url of main sheet>", "ForwarderShipments!A1:N500")` in reverse: actually put a plain editable copy that pulls into your main sheet using IMPORTRANGE. Ask if you want me to build this.

## Daily workflow

1. Open a new Claude conversation, paste `PROMPT.md` as the first message.
2. Forward or paste retailer/vendor emails to Claude. Claude returns JSON.
3. Copy the JSON rows into the appropriate tab (RetailerOrders, VendorEmailUpdates, etc.).
4. When your forwarder updates the ForwarderShipments tab, unmatched packages will highlight yellow — you resolve them by adding the correct US tracking number to USShipments.
5. Update ExchangeRates once a day.
6. Check the **Dashboard** tab for open orders, high-risk items, and totals.

## Troubleshooting

- **"Inventory Ops" menu doesn't show:** Reload the browser tab.
- **Formulas show `#N/A` in `exchange_rate_usd_twd`:** You haven't added an ExchangeRates entry for that `purchase_date`. Add it.
- **You want to rebuild from scratch:** Inventory Ops → *Rebuild system (destructive)*. This wipes and recreates all tabs. Back up first if you have data.
