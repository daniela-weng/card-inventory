import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatUsd } from "@/lib/utils";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("retailer_orders")
    .select("id, display_id, retailer, retailer_order_number, purchase_date, current_expected_delivery_date, total_price_usd, order_status, risk_status, needs_review")
    .order("purchase_date", { ascending: false })
    .limit(200);

  const rows = orders ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Orders</h1>
          <p className="text-xs text-zinc-500">{rows.length} shown. CRUD forms land in Phase 1.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retailer orders</CardTitle>
          <CardDescription>Live from the retailer_orders table.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-zinc-500">
              No orders yet. Insert a row in the Supabase SQL editor, then refresh.
            </div>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Order</TH>
                  <TH>Retailer</TH>
                  <TH>PO #</TH>
                  <TH>Purchase</TH>
                  <TH>ETA</TH>
                  <TH>Status</TH>
                  <TH>Risk</TH>
                  <TH className="text-right">Total</TH>
                </tr>
              </THead>
              <TBody>
                {rows.map((r) => (
                  <TR key={r.id as string}>
                    <TD className="font-mono text-xs">{r.display_id as string}</TD>
                    <TD>{r.retailer as string}</TD>
                    <TD className="text-xs text-zinc-400">{(r.retailer_order_number as string) ?? "—"}</TD>
                    <TD className="text-xs text-zinc-400">{(r.purchase_date as string) ?? "—"}</TD>
                    <TD className="text-xs text-zinc-400">{(r.current_expected_delivery_date as string) ?? "—"}</TD>
                    <TD><Badge tone="neutral">{r.order_status as string}</Badge></TD>
                    <TD>
                      <Badge
                        tone={
                          r.risk_status === "Critical"
                            ? "rose"
                            : r.risk_status === "High"
                            ? "amber"
                            : "neutral"
                        }
                      >
                        {r.risk_status as string}
                      </Badge>
                    </TD>
                    <TD className="text-right tabular-nums">{formatUsd(Number(r.total_price_usd ?? 0))}</TD>
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
