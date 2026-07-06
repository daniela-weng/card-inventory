import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("user_settings")
    .select("data")
    .maybeSingle();

  const hasGmail = Boolean((settings?.data as Record<string, unknown> | undefined)?.gmail_refresh_token);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Settings</h1>
        <p className="text-xs text-zinc-500">
          API keys and integration tokens. Stored in user_settings.data (jsonb).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gmail</CardTitle>
          <CardDescription>Used by Order Intake + Vendor Update agents (Phase 3).</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-zinc-400">
            {hasGmail ? "Connected." : "Not connected."}
          </p>
          {/* TODO(Phase 3): wire this button to a real OAuth flow. */}
          <Button variant="secondary" disabled title="Phase 3">
            Connect Gmail
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Forwarder Sheet</CardTitle>
          <CardDescription>Google Sheet URL for the Forwarder Sync agent (Phase 2).</CardDescription>
        </CardHeader>
        <CardContent>
          {/* TODO(Phase 2): form to save sheet URL into user_settings.data.forwarder_sheet_url */}
          <p className="text-sm text-zinc-400">Configured in Phase 2.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>EasyPost</CardTitle>
          <CardDescription>API key for the Tracking agent (Phase 4).</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">Configured in Phase 4.</p>
        </CardContent>
      </Card>
    </div>
  );
}
