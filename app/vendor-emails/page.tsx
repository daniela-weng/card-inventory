import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function VendorEmailsPage() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("vendor_email_updates")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Vendor Emails</h1>
        <p className="text-xs text-zinc-500">
          Parsed vendor update emails. Populated by the Vendor Update agent in Phase 3.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 3</CardTitle>
          <CardDescription>Rows in vendor_email_updates: {count ?? 0}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">
            Requires Gmail OAuth + Anthropic API. The table exists now; the agent that
            populates it ships with Phase 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
