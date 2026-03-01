import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Moon, Shield, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const NotificationSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    quiet_hours_enabled: true,
    quiet_hours_start: "22:00",
    quiet_hours_end: "07:00",
    priority_threshold: "normal",
    max_daily_notifications: 20,
    anti_spam_enabled: true,
    channels: { push: true, email: false, sms: false },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notification_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSettings({
            quiet_hours_enabled: data.quiet_hours_enabled,
            quiet_hours_start: data.quiet_hours_start || "22:00",
            quiet_hours_end: data.quiet_hours_end || "07:00",
            priority_threshold: data.priority_threshold,
            max_daily_notifications: data.max_daily_notifications,
            anti_spam_enabled: data.anti_spam_enabled,
            channels: (data.channels as any) || { push: true, email: false, sms: false },
          });
        }
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("notification_settings").upsert(
      { user_id: user.id, ...settings },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Notification settings updated." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
          <Bell className="h-5 w-5 text-info" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Smart Notifications</h2>
          <p className="text-xs text-muted-foreground">Configure intelligent alert preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Quiet Hours */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Quiet Hours</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Enable Quiet Hours</Label>
              <Switch checked={settings.quiet_hours_enabled} onCheckedChange={(v) => setSettings(s => ({ ...s, quiet_hours_enabled: v }))} />
            </div>
            {settings.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Start</Label>
                  <Input type="time" value={settings.quiet_hours_start} onChange={(e) => setSettings(s => ({ ...s, quiet_hours_start: e.target.value }))} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">End</Label>
                  <Input type="time" value={settings.quiet_hours_end} onChange={(e) => setSettings(s => ({ ...s, quiet_hours_end: e.target.value }))} className="h-8 text-xs" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority & Limits */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Priority & Limits</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Minimum Priority</Label>
              <Select value={settings.priority_threshold} onValueChange={(v) => setSettings(s => ({ ...s, priority_threshold: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low — All alerts</SelectItem>
                  <SelectItem value="normal">Normal — Important only</SelectItem>
                  <SelectItem value="high">High — Urgent only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Max Daily Notifications</Label>
              <Input type="number" min={1} max={100} value={settings.max_daily_notifications} onChange={(e) => setSettings(s => ({ ...s, max_daily_notifications: parseInt(e.target.value) || 20 }))} className="h-8 text-xs" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Anti-Spam AI</Label>
              <Switch checked={settings.anti_spam_enabled} onCheckedChange={(v) => setSettings(s => ({ ...s, anti_spam_enabled: v }))} />
            </div>
          </CardContent>
        </Card>

        {/* Channels */}
        <Card className="border-border bg-card md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Notification Channels</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            {(["push", "email", "sms"] as const).map((ch) => (
              <div key={ch} className="flex items-center gap-2">
                <Switch checked={settings.channels[ch]} onCheckedChange={(v) => setSettings(s => ({ ...s, channels: { ...s.channels, [ch]: v } }))} />
                <Label className="text-xs capitalize">{ch}</Label>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <button onClick={save} disabled={saving} className="rounded-lg bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
};

export default NotificationSettings;
