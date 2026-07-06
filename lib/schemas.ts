import { z } from "zod";

// ─── Enums (mirror Postgres enums exactly) ────────────────────

export const OrderStatus = z.enum([
  "Order Placed",
  "Confirmed",
  "Processing",
  "Shipped",
  "In Transit",
  "Delayed",
  "Partially Shipped",
  "Backordered",
  "Cancelled",
  "Refunded",
  "Delivered to US Forwarder",
  "Forwarder Received",
  "Shipping to Taiwan",
  "Arrived Taiwan",
  "Delivered to Buyer",
  "Needs Review",
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

export const RiskStatus = z.enum(["Low", "Medium", "High", "Critical"]);
export type RiskStatus = z.infer<typeof RiskStatus>;

export const EmailType = z.enum([
  "Order Confirmation",
  "Shipping Confirmation",
  "Delivery Date Update",
  "Delay Notice",
  "Partial Shipment",
  "Backorder Notice",
  "Cancellation",
  "Refund",
  "Payment Issue",
  "Delivered Notice",
  "Return / Replacement",
  "General Vendor Message",
  "Unknown",
]);
export type EmailType = z.infer<typeof EmailType>;

export const ItemStatus = z.enum([
  "Ordered",
  "Shipped",
  "Partially Shipped",
  "Cancelled",
  "Refunded",
  "Received at Forwarder",
  "Delivered to Buyer",
  "Backordered",
]);
export type ItemStatus = z.infer<typeof ItemStatus>;

export const InventoryStatus = z.enum([
  "In Transit",
  "At US Forwarder",
  "Shipping to Taiwan",
  "Available",
  "Reserved",
  "Sold",
  "Lost",
  "Damaged",
]);
export type InventoryStatus = z.infer<typeof InventoryStatus>;

export const ShipmentStatus = z.enum([
  "Label Created",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Exception",
  "Returned",
  "Lost",
]);
export type ShipmentStatus = z.infer<typeof ShipmentStatus>;

export const ForwarderStatus = z.enum([
  "Awaiting Arrival",
  "Received",
  "Consolidating",
  "Shipped to Taiwan",
  "Arrived Taiwan",
  "Delivered",
  "Held",
  "Lost",
]);
export type ForwarderStatus = z.infer<typeof ForwarderStatus>;

export const TaiwanDeliveryStatus = z.enum([
  "Awaiting Ship",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Exception",
]);
export type TaiwanDeliveryStatus = z.infer<typeof TaiwanDeliveryStatus>;

export const Severity = z.enum(["Info", "Low", "Medium", "High", "Critical"]);
export type Severity = z.infer<typeof Severity>;

// ─── Row schemas (Zod source of truth for forms) ──────────────

const uuid = z.string().uuid();
const isoDate = z.string().date().or(z.string().datetime()).nullable().optional();
const money = z.number().nullable().optional();

export const RetailerOrderSchema = z.object({
  id: uuid.optional(),
  user_id: uuid.optional(),
  display_id: z.string().optional(),
  retailer: z.string().min(1),
  purchase_date: isoDate,
  retailer_order_number: z.string().nullable().optional(),
  original_expected_delivery_date: isoDate,
  current_expected_delivery_date: isoDate,
  total_price_usd: money,
  sales_tax_usd: money,
  domestic_shipping_usd: money,
  payment_method: z.string().nullable().optional(),
  order_status: OrderStatus.default("Order Placed"),
  risk_status: RiskStatus.default("Low"),
  delay_count: z.number().int().default(0),
  latest_vendor_update: z.string().nullable().optional(),
  last_vendor_email_date: z.string().datetime().nullable().optional(),
  needs_review: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  source_email_id: z.string().nullable().optional(),
  source_email_link: z.string().nullable().optional(),
});
export type RetailerOrder = z.infer<typeof RetailerOrderSchema>;

export const OrderItemSchema = z.object({
  id: uuid.optional(),
  user_id: uuid.optional(),
  retailer_order_id: uuid,
  display_id: z.string().optional(),
  product_name: z.string().min(1),
  product_category: z.string().default("Sports Cards"),
  sku: z.string().nullable().optional(),
  quantity_ordered: z.number().int().default(1),
  quantity_cancelled: z.number().int().default(0),
  quantity_received: z.number().int().default(0),
  unit_price_usd: money,
  total_item_price_usd: money,
  estimated_value_twd: money,
  item_status: ItemStatus.default("Ordered"),
  notes: z.string().nullable().optional(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const UsShipmentSchema = z.object({
  id: uuid.optional(),
  user_id: uuid.optional(),
  retailer_order_id: uuid,
  display_id: z.string().optional(),
  carrier: z.string().nullable().optional(),
  us_tracking_number: z.string().nullable().optional(),
  shipment_status: ShipmentStatus.default("Label Created"),
  shipped_date: isoDate,
  expected_delivery_date: isoDate,
  actual_delivery_date: isoDate,
  delivered_to_forwarder: z.boolean().default(false),
  tracking_source: z.string().nullable().optional(),
  easypost_tracker_id: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type UsShipment = z.infer<typeof UsShipmentSchema>;

export const VendorEmailUpdateSchema = z.object({
  id: uuid.optional(),
  user_id: uuid.optional(),
  retailer_order_id: uuid.nullable().optional(),
  display_id: z.string().optional(),
  retailer: z.string().nullable().optional(),
  retailer_order_number: z.string().nullable().optional(),
  email_subject: z.string().nullable().optional(),
  email_date: z.string().datetime().nullable().optional(),
  email_type: EmailType.default("Unknown"),
  update_type: z.string().nullable().optional(),
  old_expected_delivery_date: isoDate,
  new_expected_delivery_date: isoDate,
  us_tracking_number: z.string().nullable().optional(),
  affected_items: z.array(z.string()).nullable().optional(),
  severity: Severity.default("Info"),
  action_needed: z.string().nullable().optional(),
  confidence_score: z.number().min(0).max(1).nullable().optional(),
  raw_email_summary: z.string().nullable().optional(),
  source_email_id: z.string().nullable().optional(),
  source_email_link: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type VendorEmailUpdate = z.infer<typeof VendorEmailUpdateSchema>;

export const ForwarderShipmentSchema = z.object({
  id: uuid.optional(),
  user_id: uuid.optional(),
  display_id: z.string().optional(),
  us_tracking_number: z.string().nullable().optional(),
  matched_retailer_order_id: uuid.nullable().optional(),
  warehouse_received_date: isoDate,
  forwarder_status: ForwarderStatus.default("Awaiting Arrival"),
  package_weight: z.number().nullable().optional(),
  shipping_cost_usd: money,
  taiwan_tracking_number: z.string().nullable().optional(),
  taiwan_carrier: z.string().nullable().optional(),
  taiwan_ship_date: isoDate,
  taiwan_delivery_status: TaiwanDeliveryStatus.nullable().optional(),
  taiwan_delivery_date: isoDate,
  notes: z.string().nullable().optional(),
});
export type ForwarderShipment = z.infer<typeof ForwarderShipmentSchema>;

export const InventoryLotSchema = z.object({
  id: uuid.optional(),
  user_id: uuid.optional(),
  retailer_order_id: uuid.nullable().optional(),
  order_item_id: uuid.nullable().optional(),
  display_id: z.string().optional(),
  product_name: z.string().min(1),
  quantity_available: z.number().int().default(0),
  quantity_reserved: z.number().int().default(0),
  quantity_sold: z.number().int().default(0),
  landed_cost_usd: money,
  unit_landed_cost_usd: money,
  landed_cost_twd: money,
  unit_landed_cost_twd: money,
  inventory_status: InventoryStatus.default("In Transit"),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type InventoryLot = z.infer<typeof InventoryLotSchema>;

export const ExchangeRateSchema = z.object({
  id: uuid.optional(),
  user_id: uuid.optional(),
  rate_date: z.string().date(),
  usd_to_twd_rate: z.number().positive(),
  source: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type ExchangeRate = z.infer<typeof ExchangeRateSchema>;

export const ExceptionSchema = z.object({
  id: uuid.optional(),
  user_id: uuid.optional(),
  display_id: z.string().optional(),
  exception_type: z.string().min(1),
  severity: Severity.default("Medium"),
  retailer_order_id: uuid.nullable().optional(),
  forwarder_shipment_id: uuid.nullable().optional(),
  description: z.string().nullable().optional(),
  resolved_at: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type Exception = z.infer<typeof ExceptionSchema>;
