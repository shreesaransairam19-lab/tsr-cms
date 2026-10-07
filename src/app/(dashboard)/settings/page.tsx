"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Building2,
  BookOpen,
  Calendar,
  CreditCard,
  Bell,
  Mail,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [saving, setSaving] = React.useState(false);
  const [settings, setSettings] = React.useState<Record<string, string>>({});
  const [emailConfigured, setEmailConfigured] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success && json.data) {
        const map: Record<string, string> = {};
        json.data.forEach((s: { setting_key: string; setting_value: string }) => {
          map[s.setting_key] = s.setting_value;
        });
        setSettings(map);
      }

      fetch("/api/settings/email")
        .then((r) => r.json())
        .then((data) => setEmailConfigured(data.configured))
        .catch(() => {});
    }
    load();
  }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async (category: string) => {
    setSaving(true);
    try {
      const settingsToSave = Object.entries(settings)
        .filter(([key]) => key.startsWith(category))
        .map(([key, value]) => ({ key, value }));

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsToSave }),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: "Saved", description: "Settings updated successfully" });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage college and system configuration</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="academic" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Academic
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email
            {emailConfigured && <CheckCircle className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Payment
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>College Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">College Name</label>
                  <Input
                    value={settings["college_name"] || "TSR"}
                    onChange={(e) => updateSetting("college_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">College Code</label>
                  <Input
                    value={settings["college_code"] || ""}
                    onChange={(e) => updateSetting("college_code", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Textarea
                  value={settings["college_address"] || ""}
                  onChange={(e) => updateSetting("college_address", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={settings["college_phone"] || ""}
                    onChange={(e) => updateSetting("college_phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={settings["college_email"] || ""}
                    onChange={(e) => updateSetting("college_email", e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={() => saveSettings("college_")} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Settings */}
        <TabsContent value="academic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Academic Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Academic Year</label>
                  <Input
                    value={settings["academic_year"] || "2025-26"}
                    onChange={(e) => updateSetting("academic_year", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Attendance Required (%)</label>
                  <Input
                    type="number"
                    value={settings["attendance_required"] || "75"}
                    onChange={(e) => updateSetting("attendance_required", e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={() => saveSettings("academic_")} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Gmail Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailConfigured ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Gmail is configured</p>
                    <p className="text-sm text-green-600">Emails are being sent via Gmail SMTP</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <Mail className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">Gmail not configured</p>
                    <p className="text-sm text-amber-600">Add your Gmail credentials to enable email notifications</p>
                  </div>
                </div>
              )}

              <Button
                onClick={() => router.push("/settings/email")}
                className="flex items-center gap-2"
              >
                {emailConfigured ? "Update Email Settings" : "Set Up Gmail"}
                <ExternalLink className="h-4 w-4" />
              </Button>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>Once configured, emails will be sent for:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>Attendance alerts (low attendance warnings)</li>
                  <li>Fee payment reminders</li>
                  <li>Exam schedule notifications</li>
                  <li>Result publication alerts</li>
                  <li>Password reset links</li>
                  <li>General announcements</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Gateway (Razorpay)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <CreditCard className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Add Razorpay keys later</p>
                  <p className="text-sm text-amber-600">When ready, add your Razorpay API keys to enable online payments</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Razorpay Key ID</label>
                  <Input placeholder="rzp_test_..." disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Razorpay Key Secret</label>
                  <Input type="password" placeholder="••••••••" disabled />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Online payment will be available after adding Razorpay keys to <code>.env.local</code>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      {emailConfigured ? "Enabled via Gmail" : "Configure Gmail in Email tab"}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${emailConfigured ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                    {emailConfigured ? "Active" : "Inactive"}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Add MSG91 API key to .env.local</p>
                  </div>
                  <div className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-600">Inactive</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">WhatsApp Notifications</p>
                    <p className="text-sm text-muted-foreground">Add WhatsApp API to .env.local</p>
                  </div>
                  <div className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-600">Inactive</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
