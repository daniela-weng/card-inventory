/**
 * AI Inventory Operations System — one-click builder
 *
 * How to use:
 *   1. Open a new blank Google Sheet.
 *   2. Extensions → Apps Script.
 *   3. Paste this entire file, save, then run buildInventorySystem() once.
 *      (You'll be asked to approve permissions the first time.)
 *   4. Return to the Sheet — all 8 tabs, dropdowns, formulas, and formatting
 *      will be in place.
 *
 * After setup, use the "Inventory Ops" menu (top bar) for:
 *   - New order ID, New item ID, New shipment ID, etc.
 *   - Refresh dashboard
 */

// ---------- Enums (from AI Inventory Operations Guide) ----------
const ENUMS = {
  order_status: [
    'Order Placed', 'Confirmed', 'Processing', 'Shipped', 'In Transit',
    'Delayed', 'Partially Shipped', 'Backordered', 'Cancelled', 'Refunded',
    'Delivered to US Forwarder', 'Forwarder Received', 'Shipping to Taiwan',
    'Arrived Taiwan', 'Delivered to Buyer', 'Needs Review'
  ],
  risk_status: ['Low', 'Medium', 'High', 'Critical'],
  email_type: [
    'Order Confirmation', 'Shipping Confirmation', 'Delivery Date Update',
    'Delay Notice', 'Partial Shipment', 'Backorder Notice', 'Cancellation',
    'Refund', 'Payment Issue', 'Delivered Notice', 'Return / Replacement',
    'General Vendor Message', 'Unknown'
  ],
  item_status: [
    'Ordered', 'Shipped', 'Partially Shipped', 'Cancelled', 'Refunded',
    'Received at Forwarder', 'Delivered to Buyer', 'Backordered'
  ],
  inventory_status: [
    'In Transit', 'At US Forwarder', 'Shipping to Taiwan', 'Available',
    'Reserved', 'Sold', 'Lost', 'Damaged'
  ],
  shipment_status: [
    'Label Created', 'In Transit', 'Out for Delivery', 'Delivered',
    'Exception', 'Returned', 'Lost'
  ],
  retailer: [
    'Target', "Dick's Sporting Goods", 'Topps', 'Fanatics', 'Walmart',
    'eBay', 'Other'
  ],
  severity: ['Info', 'Low', 'Medium', 'High', 'Critical'],
  forwarder_status: [
    'Awaiting Arrival', 'Received', 'Consolidating', 'Shipped to Taiwan',
    'Arrived Taiwan', 'Delivered', 'Held', 'Lost'
  ],
  taiwan_delivery_status: [
    'Awaiting Ship', 'In Transit', 'Out for Delivery', 'Delivered', 'Exception'
  ]
};

// ---------- Table schemas ----------
// Each row: [header, format?, dropdownKey?, formula?]
// format: 'date' | 'usd' | 'twd' | 'number' | 'bool' | 'text'
// formula: template using {row} placeholder; applied per data row
const TABLES = {
  RetailerOrders: [
    ['internal_order_id', 'text'],
    ['retailer', 'text', 'retailer'],
    ['purchase_date', 'date'],
    ['retailer_order_number', 'text'],
    ['original_expected_delivery_date', 'date'],
    ['current_expected_delivery_date', 'date'],
    ['total_price_usd', 'usd'],
    ['sales_tax_usd', 'usd'],
    ['domestic_shipping_usd', 'usd'],
    ['exchange_rate_usd_twd', 'number',
      null,
      '=IFERROR(VLOOKUP(C{row},ExchangeRates!A:B,2,FALSE),"")'],
    ['total_price_twd', 'twd',
      null,
      '=IFERROR((G{row}+H{row}+I{row})*J{row},"")'],
    ['payment_method', 'text'],
    ['order_status', 'text', 'order_status'],
    ['risk_status', 'text', 'risk_status'],
    ['delay_count', 'number'],
    ['latest_vendor_update', 'text'],
    ['last_vendor_email_date', 'date'],
    ['needs_review', 'bool'],
    ['notes', 'text'],
    ['source_email_id', 'text'],
    ['source_email_link', 'text']
  ],
  OrderItems: [
    ['internal_item_id', 'text'],
    ['internal_order_id', 'text'],
    ['retailer_order_number', 'text'],
    ['product_name', 'text'],
    ['product_category', 'text'],
    ['sku', 'text'],
    ['quantity_ordered', 'number'],
    ['quantity_cancelled', 'number'],
    ['quantity_received', 'number'],
    ['unit_price_usd', 'usd'],
    ['total_item_price_usd', 'usd', null, '=IFERROR(G{row}*J{row},"")'],
    ['estimated_value_twd', 'twd'],
    ['item_status', 'text', 'item_status'],
    ['notes', 'text']
  ],
  USShipments: [
    ['internal_shipment_id', 'text'],
    ['internal_order_id', 'text'],
    ['retailer_order_number', 'text'],
    ['carrier', 'text'],
    ['us_tracking_number', 'text'],
    ['shipment_status', 'text', 'shipment_status'],
    ['shipped_date', 'date'],
    ['expected_delivery_date', 'date'],
    ['actual_delivery_date', 'date'],
    ['delivered_to_forwarder', 'bool'],
    ['tracking_source', 'text'],
    ['notes', 'text']
  ],
  VendorEmailUpdates: [
    ['vendor_update_id', 'text'],
    ['internal_order_id', 'text'],
    ['retailer', 'text', 'retailer'],
    ['retailer_order_number', 'text'],
    ['email_subject', 'text'],
    ['email_date', 'date'],
    ['email_type', 'text', 'email_type'],
    ['update_type', 'text'],
    ['old_expected_delivery_date', 'date'],
    ['new_expected_delivery_date', 'date'],
    ['us_tracking_number', 'text'],
    ['affected_items', 'text'],
    ['severity', 'text', 'severity'],
    ['action_needed', 'text'],
    ['confidence_score', 'number'],
    ['raw_email_summary', 'text'],
    ['source_email_id', 'text'],
    ['source_email_link', 'text'],
    ['notes', 'text']
  ],
  ForwarderShipments: [
    ['forwarder_record_id', 'text'],
    ['us_tracking_number', 'text'],
    ['matched_internal_order_id', 'text',
      null,
      '=IFERROR(INDEX(USShipments!B:B,MATCH(B{row},USShipments!E:E,0)),"UNMATCHED")'],
    ['warehouse_received_date', 'date'],
    ['forwarder_status', 'text', 'forwarder_status'],
    ['package_weight', 'number'],
    ['shipping_cost_usd', 'usd'],
    ['shipping_cost_twd', 'twd',
      null,
      '=IFERROR(G{row}*IFERROR(VLOOKUP(D{row},ExchangeRates!A:B,2,FALSE),VLOOKUP(TODAY(),ExchangeRates!A:B,2,FALSE)),"")'],
    ['taiwan_tracking_number', 'text'],
    ['taiwan_carrier', 'text'],
    ['taiwan_ship_date', 'date'],
    ['taiwan_delivery_status', 'text', 'taiwan_delivery_status'],
    ['taiwan_delivery_date', 'date'],
    ['notes', 'text']
  ],
  InventoryLots: [
    ['inventory_lot_id', 'text'],
    ['internal_order_id', 'text'],
    ['internal_item_id', 'text'],
    ['product_name', 'text'],
    ['quantity_available', 'number'],
    ['quantity_reserved', 'number'],
    ['quantity_sold', 'number'],
    ['landed_cost_usd', 'usd'],
    ['unit_landed_cost_usd', 'usd',
      null,
      '=IFERROR(H{row}/(E{row}+F{row}+G{row}),"")'],
    ['landed_cost_twd', 'twd',
      null,
      '=IFERROR(H{row}*IFERROR(VLOOKUP(TODAY(),ExchangeRates!A:B,2,FALSE),""),"")'],
    ['unit_landed_cost_twd', 'twd',
      null,
      '=IFERROR(I{row}*IFERROR(VLOOKUP(TODAY(),ExchangeRates!A:B,2,FALSE),""),"")'],
    ['inventory_status', 'text', 'inventory_status'],
    ['location', 'text'],
    ['notes', 'text']
  ],
  ExchangeRates: [
    ['rate_date', 'date'],
    ['usd_to_twd_rate', 'number'],
    ['source', 'text'],
    ['notes', 'text']
  ]
};

const DATA_ROWS = 500; // pre-fill formulas/validation for 500 rows per tab

// ---------- Main entry ----------
function buildInventorySystem() {
  const ss = SpreadsheetApp.getActive();
  ensureEnumsSheet_(ss);

  Object.keys(TABLES).forEach(name => {
    const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    buildTable_(sheet, name, TABLES[name]);
  });

  buildDashboard_(ss);

  // Remove default "Sheet1" if empty
  const s1 = ss.getSheetByName('Sheet1');
  if (s1 && s1.getLastRow() === 0) ss.deleteSheet(s1);

  // Reorder tabs
  const order = ['Dashboard', 'RetailerOrders', 'OrderItems', 'USShipments',
    'VendorEmailUpdates', 'ForwarderShipments', 'InventoryLots', 'ExchangeRates'];
  order.forEach((name, i) => {
    const sh = ss.getSheetByName(name);
    if (sh) { ss.setActiveSheet(sh); ss.moveActiveSheet(i + 1); }
  });
  ss.setActiveSheet(ss.getSheetByName('Dashboard'));

  SpreadsheetApp.getUi().alert(
    'Inventory system built.\n\n' +
    '1. Add today\'s USD→TWD rate on the ExchangeRates tab.\n' +
    '2. Start adding orders on RetailerOrders (or paste JSON rows from Claude).\n' +
    '3. Share ForwarderShipments tab with your forwarder.\n\n' +
    'Use the "Inventory Ops" menu for ID generation and dashboard refresh.'
  );
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Inventory Ops')
    .addItem('Generate new order ID',      'menuNewOrderId')
    .addItem('Generate new item ID',       'menuNewItemId')
    .addItem('Generate new shipment ID',   'menuNewShipmentId')
    .addItem('Generate new forwarder ID',  'menuNewForwarderId')
    .addItem('Generate new lot ID',        'menuNewLotId')
    .addItem('Generate new vendor update ID','menuNewVendorUpdateId')
    .addSeparator()
    .addItem('Refresh dashboard', 'refreshDashboard')
    .addSeparator()
    .addItem('Rebuild system (destructive)', 'buildInventorySystem')
    .addToUi();
}

// ---------- Table builder ----------
function buildTable_(sheet, name, columns) {
  sheet.clear();
  sheet.setFrozenRows(1);

  const headers = columns.map(c => c[0]);
  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#1f2937')
    .setFontColor('#ffffff');

  // Apply formats, validations, formulas across DATA_ROWS
  columns.forEach((col, idx) => {
    const [header, fmt, dropdownKey, formula] = col;
    const colIndex = idx + 1;
    const range = sheet.getRange(2, colIndex, DATA_ROWS, 1);

    // Formats
    switch (fmt) {
      case 'date':   range.setNumberFormat('yyyy-mm-dd'); break;
      case 'usd':    range.setNumberFormat('$#,##0.00');  break;
      case 'twd':    range.setNumberFormat('NT$#,##0');   break;
      case 'number': range.setNumberFormat('#,##0.####'); break;
      case 'bool':
        range.setDataValidation(SpreadsheetApp.newDataValidation()
          .requireValueInList(['TRUE', 'FALSE'], true).build());
        break;
    }

    // Dropdowns from _enums sheet
    if (dropdownKey && ENUMS[dropdownKey]) {
      const enumRange = getEnumRange_(sheet.getParent(), dropdownKey);
      range.setDataValidation(SpreadsheetApp.newDataValidation()
        .requireValueInRange(enumRange, true).setAllowInvalid(false).build());
    }

    // Formulas
    if (formula) {
      const formulas = [];
      for (let r = 2; r < 2 + DATA_ROWS; r++) {
        formulas.push([formula.replace(/\{row\}/g, r)]);
      }
      range.setFormulas(formulas);
    }
  });

  // Reasonable column widths
  headers.forEach((h, i) => sheet.setColumnWidth(i + 1, Math.max(90, h.length * 9 + 20)));

  // needs_review conditional formatting (row-level red tint)
  const needsReviewIdx = headers.indexOf('needs_review');
  if (needsReviewIdx >= 0) {
    const rowsRange = sheet.getRange(2, 1, DATA_ROWS, headers.length);
    const col = colLetter_(needsReviewIdx + 1);
    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=$${col}2=TRUE`)
      .setBackground('#fde2e2')
      .setRanges([rowsRange])
      .build();
    const rules = sheet.getConditionalFormatRules();
    rules.push(rule);
    sheet.setConditionalFormatRules(rules);
  }

  // risk_status color scale
  const riskIdx = headers.indexOf('risk_status');
  if (riskIdx >= 0) {
    const riskRange = sheet.getRange(2, riskIdx + 1, DATA_ROWS, 1);
    const rules = sheet.getConditionalFormatRules();
    [['Low','#d1fae5'],['Medium','#fef3c7'],['High','#fed7aa'],['Critical','#fecaca']]
      .forEach(([val, color]) => {
        rules.push(SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo(val).setBackground(color).setRanges([riskRange]).build());
      });
    sheet.setConditionalFormatRules(rules);
  }

  // Highlight UNMATCHED in ForwarderShipments
  if (name === 'ForwarderShipments') {
    const idx = headers.indexOf('matched_internal_order_id');
    if (idx >= 0) {
      const r = sheet.getRange(2, idx + 1, DATA_ROWS, 1);
      const rules = sheet.getConditionalFormatRules();
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('UNMATCHED').setBackground('#fef08a').setRanges([r]).build());
      sheet.setConditionalFormatRules(rules);
    }
  }
}

// ---------- Enums sheet ----------
function ensureEnumsSheet_(ss) {
  let sh = ss.getSheetByName('_enums');
  if (!sh) sh = ss.insertSheet('_enums');
  sh.clear();
  const keys = Object.keys(ENUMS);
  keys.forEach((key, colIdx) => {
    sh.getRange(1, colIdx + 1).setValue(key).setFontWeight('bold');
    const vals = ENUMS[key].map(v => [v]);
    sh.getRange(2, colIdx + 1, vals.length, 1).setValues(vals);
  });
  sh.hideSheet();
}

function getEnumRange_(ss, key) {
  const sh = ss.getSheetByName('_enums');
  const keys = Object.keys(ENUMS);
  const colIdx = keys.indexOf(key) + 1;
  const n = ENUMS[key].length;
  return sh.getRange(2, colIdx, n, 1);
}

// ---------- Dashboard ----------
function buildDashboard_(ss) {
  const sh = ss.getSheetByName('Dashboard') || ss.insertSheet('Dashboard');
  sh.clear();
  sh.getRange('A1').setValue('AI Inventory Operations — Dashboard')
    .setFontSize(16).setFontWeight('bold');
  sh.getRange('A2').setValue('=CONCAT("Last refreshed: ",TEXT(NOW(),"yyyy-mm-dd hh:mm"))')
    .setFontColor('#6b7280');

  const rows = [
    ['Open orders (not delivered / cancelled / refunded)',
      '=COUNTIFS(RetailerOrders!M:M,"<>Delivered to Buyer",RetailerOrders!M:M,"<>Cancelled",RetailerOrders!M:M,"<>Refunded",RetailerOrders!A:A,"<>")'],
    ['Delayed orders',
      '=COUNTIF(RetailerOrders!M:M,"Delayed")'],
    ['Orders flagged needs_review',
      '=COUNTIF(RetailerOrders!R:R,TRUE)'],
    ['High risk',
      '=COUNTIF(RetailerOrders!N:N,"High")'],
    ['Critical risk',
      '=COUNTIF(RetailerOrders!N:N,"Critical")'],
    ['Packages at US forwarder',
      '=COUNTIF(ForwarderShipments!E:E,"Received")'],
    ['Packages shipping to Taiwan',
      '=COUNTIF(ForwarderShipments!E:E,"Shipped to Taiwan")'],
    ['Packages delivered in Taiwan',
      '=COUNTIF(ForwarderShipments!L:L,"Delivered")'],
    ['Unmatched forwarder packages',
      '=COUNTIF(ForwarderShipments!C:C,"UNMATCHED")'],
    ['Total outstanding USD (not delivered)',
      '=SUMIFS(RetailerOrders!G:G,RetailerOrders!M:M,"<>Delivered to Buyer",RetailerOrders!M:M,"<>Cancelled",RetailerOrders!M:M,"<>Refunded")'],
    ['Total outstanding TWD (not delivered)',
      '=SUMIFS(RetailerOrders!K:K,RetailerOrders!M:M,"<>Delivered to Buyer",RetailerOrders!M:M,"<>Cancelled",RetailerOrders!M:M,"<>Refunded")'],
    ['Inventory units available',
      '=SUM(InventoryLots!E:E)'],
    ['Inventory units reserved',
      '=SUM(InventoryLots!F:F)'],
    ['Inventory units sold',
      '=SUM(InventoryLots!G:G)']
  ];
  sh.getRange(4, 1, rows.length, 2).setValues(rows);
  sh.getRange(4, 1, rows.length, 1).setFontWeight('bold');
  sh.setColumnWidth(1, 400);
  sh.setColumnWidth(2, 160);

  // Format currency cells
  sh.getRange(13, 2).setNumberFormat('$#,##0.00');
  sh.getRange(14, 2).setNumberFormat('NT$#,##0');
}

function refreshDashboard() {
  buildDashboard_(SpreadsheetApp.getActive());
  SpreadsheetApp.getActive().toast('Dashboard refreshed.');
}

// ---------- ID generators ----------
function menuNewOrderId()        { promptId_('ORD'); }
function menuNewItemId()         { promptId_('ITM'); }
function menuNewShipmentId()     { promptId_('SHP'); }
function menuNewForwarderId()    { promptId_('FWD'); }
function menuNewLotId()          { promptId_('LOT'); }
function menuNewVendorUpdateId() { promptId_('VUP'); }

function promptId_(prefix) {
  const d = Utilities.formatDate(new Date(),
    Session.getScriptTimeZone(), 'yyyyMMdd');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const id = `${prefix}-${d}-${rand}`;
  const ui = SpreadsheetApp.getUi();
  ui.prompt(`New ID (copy this)`, id, ui.ButtonSet.OK);
}

// ---------- Helpers ----------
function colLetter_(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; }
  return s;
}
