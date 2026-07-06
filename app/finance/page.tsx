import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function FinancePage() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("exchange_rates")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Finance</h1>
        <p className="text-xs text-zinc-500">
          USD → TWD exchange rates and landed-cost reports.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 1</CardTitle>
          <CardDescription>Rows in exchange_rates: {count ?? 0}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">
            Rate is looked up per order&apos;s purchase_date (most recent on or before).
            TWD values are computed at read time, never stored as generated columns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
