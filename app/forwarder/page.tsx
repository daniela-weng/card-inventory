import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function ForwarderPage() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("forwarder_shipments")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Forwarder</h1>
        <p className="text-xs text-zinc-500">
          Packages received at the US forwarder and their onward journey to Taiwan.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 2</CardTitle>
          <CardDescription>Rows in forwarder_shipments: {count ?? 0}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">
            The Forwarder Sync agent ingests the forwarder&apos;s Google Sheet
            and attempts to match tracking numbers to retailer orders.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
