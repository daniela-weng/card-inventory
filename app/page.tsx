import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatUsd } from "@/lib/utils";
import {
  Package,
  Clock,
  Eye,
  AlertTriangle,
  Flame,
  Warehouse,
  Plane,
  MapPin,
  Link2Off,
  DollarSign,
  Boxes,
  ShoppingBag,
} from "lucide-react";

const OPEN_EXCLUDE = ["Delivered to Buyer", "Cancelled", "Refunded"];

async function loadStats() {
  const supabase = await createClient();

  // Every count uses head:true and count:'exact' — returns 0 on empty tables, not an error.
  const [
    openOrders,
    delayed,
    needsReview,
    highRisk,
    criticalRisk,
    atForwarder,
    shippingToTw,
    deliveredTw,
    unmatchedFwd,
    outstandingUsd,
    unitsAvailable,
    unitsSold,
    attention,
  ] = await Promise.all([
    supabase
      .from("retailer_orders")
      .select("*", { count: "exact", head: true })
      .not("order_status", "in", `(${OPEN_EXCLUDE.map((s) => `"${s}"`).join(",")})`),
    supabase
      .from("retailer_orders")
      .select("*", { count: "exact", head: true })
      .eq("order_status", "Delayed"),
    supabase
      .from("retailer_orders")
      .select("*", { count: "exact", head: true })
      .eq("needs_review", true),
    supabase
      .from("retailer_orders")
      .select("*", { count: "exact", head: true })
      .eq("risk_status", "High"),
    supabase
      .from("retailer_orders")
      .select("*", { count: "exact", head: true })
      .eq("risk_status", "Critical"),
    supabase
      .from("forwarder_shipments")
      .select("*", { count: "exact", head: true })
      .eq("forwarder_status", "Received"),
    supabase
      .from("forwarder_shipments")
      .select("*", { count: "exact", head: true })
      .eq("forwarder_status", "Shipped to Taiwan"),
    supabase
      .from("forwarder_shipments")
      .select("*", { count: "exact", head: true })
      .eq("taiwan_delivery_status", "Delivered"),
    supabase
      .from("forwarder_shipments")
      .select("*", { count: "exact", head: true })
      .is("matched_retailer_order_id", null),
    supabase
      .from("retailer_orders")
      .select("total_price_usd, order_status")
      .not("order_status", "in", `(${OPEN_EXCLUDE.map((s) => `"${s}"`).join(",")})`),
    supabase
      .from("inventory_lots")
      .select("quantity_available"),
    supabase
      .from("inventory_lots")
      .select("quantity_sold"),
    supabase
      .from("retailer_orders")
      .select("id, display_id, retailer, order_status, risk_status, needs_review, current_expected_delivery_date, total_price_usd")
      .or("needs_review.eq.true,risk_status.in.(High,Critical)")
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);

  const outstanding =
    outstandingUsd.data?.reduce((acc, r) => acc + Number(r.total_price_usd ?? 0), 0) ?? 0;
  const available =
    unitsAvailable.data?.reduce((acc, r) => acc + Number(r.quantity_available ?? 0), 0) ?? 0;
  const sold =
    unitsSold.data?.reduce((acc, r) => acc + Number(r.quantity_sold ?? 0), 0) ?? 0;

  return {
    openOrders: openOrders.count ?? 0,
    delayed: delayed.count ?? 0,
    needsReview: needsReview.count ?? 0,
    highRisk: highRisk.count ?? 0,
    criticalRisk: criticalRisk.count ?? 0,
    atForwarder: atForwarder.count ?? 0,
    shippingToTw: shippingToTw.count ?? 0,
    deliveredTw: deliveredTw.count ?? 0,
    unmatchedFwd: unmatchedFwd.count ?? 0,
    outstanding,
    available,
    sold,
    attention: attention.data ?? [],
  };
}

export default async function DashboardPage() {
  const s = await loadStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Dashboard</h1>
        <p className="text-xs text-zinc-500">Live counts from Supabase. Empty on a fresh database.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Open orders" value={formatNumber(s.openOrders)} icon={Package} />
        <StatCard label="Delayed" value={formatNumber(s.delayed)} icon={Clock} tone={s.delayed > 0 ? "amber" : "default"} />
        <StatCard label="Needs review" value={formatNumber(s.needsReview)} icon={Eye} tone={s.needsReview > 0 ? "amber" : "default"} />
        <StatCard label="High risk" value={formatNumber(s.highRisk)} icon={AlertTriangle} tone={s.highRisk > 0 ? "amber" : "default"} />
        <StatCard label="Critical risk" value={formatNumber(s.criticalRisk)} icon={Flame} tone={s.criticalRisk > 0 ? "rose" : "default"} />
        <StatCard label="At forwarder" value={formatNumber(s.atForwarder)} icon={Warehouse} tone="sky" />
        <StatCard label="Shipping to Taiwan" value={formatNumber(s.shippingToTw)} icon={Plane} tone="sky" />
        <StatCard label="Delivered in TW" value={formatNumber(s.deliveredTw)} icon={MapPin} tone="emerald" />
        <StatCard label="Unmatched fwd pkgs" value={formatNumber(s.unmatchedFwd)} icon={Link2Off} tone={s.unmatchedFwd > 0 ? "amber" : "default"} />
        <StatCard label="Outstanding USD" value={formatUsd(s.outstanding)} icon={DollarSign} tone="indigo" />
        <StatCard label="Units available" value={formatNumber(s.available)} icon={Boxes} />
        <StatCard label="Units sold" value={formatNumber(s.sold)} icon={ShoppingBag} tone="emerald" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attention needed</CardTitle>
          <CardDescription>
            Orders flagged as needs review or High / Critical risk.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {s.attention.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-zinc-500">
              Nothing needs attention.
            </div>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Order</TH>
                  <TH>Retailer</TH>
                  <TH>Status</TH>
                  <TH>Risk</TH>
                  <TH>ETA</TH>
                  <TH className="text-right">Total</TH>
                </tr>
              </THead>
              <TBody>
                {s.attention.map((row) => (
                  <TR key={row.id as string}>
                    <TD className="font-mono text-xs">{row.display_id as string}</TD>
                    <TD>{row.retailer as string}</TD>
                    <TD>
                      <Badge tone="neutral">{row.order_status as string}</Badge>
                    </TD>
                    <TD>
                      <Badge
                        tone={
                          row.risk_status === "Critical"
                            ? "rose"
                            : row.risk_status === "High"
                            ? "amber"
                            : "neutral"
                        }
                      >
                        {row.risk_status as string}
                      </Badge>
                    </TD>
                    <TD className="text-xs text-zinc-400">
                      {(row.current_expected_delivery_date as string) ?? "—"}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatUsd(Number(row.total_price_usd ?? 0))}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
