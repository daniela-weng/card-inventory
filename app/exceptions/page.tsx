import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function ExceptionsPage() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("exceptions")
    .select("*", { count: "exact", head: true })
    .is("resolved_at", null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Exceptions</h1>
        <p className="text-xs text-zinc-500">
          Situations flagged by the Exception agent for human review.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 1</CardTitle>
          <CardDescription>Open exceptions: {count ?? 0}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">
            The Exception agent surfaces stale orders, unmatched forwarder
            packages, and high-risk states here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
