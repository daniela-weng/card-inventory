import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function InventoryPage() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("inventory_lots")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Inventory</h1>
        <p className="text-xs text-zinc-500">Landed-cost inventory lots in Taiwan.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 1</CardTitle>
          <CardDescription>Rows in inventory_lots: {count ?? 0}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">
            The Finance agent computes landed cost (USD + TWD) once orders and
            forwarder shipments exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
