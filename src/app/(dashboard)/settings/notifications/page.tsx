"use client";

import * as React from "react";
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

export default function NotificationSettingsPage() {
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);

  const [smsConfig, setSmsConfig] = React.useState({
    enabled: false,
    api_key: "",
    sender_id: "",
    // MSG91 API endpoint: https://api.msg91.com/api/v5/flow/
    // Get your API key from: https://msg91.com
    template_id: "",
  });

  const [emailConfig, setEmailConfig] = React.useState({
    enabled: false,
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    smtp_pass: "",
    from_name: "TSR CMS",
    from_email: "",
    use_tls: true,
  });

  const [whatsappConfig, setWhatsappConfig] = React.useState({
    enabled: false,
    // WhatsApp Business API placeholder
    // Configure your WhatsApp Business API endpoint here
    api_url: "",
    api_token: "",
    phone_number_id: "",
  });

  const [templates, setTemplates] = React.useState([
    { id: "1", name: "Fee Reminder", subject: "Fee Payment Reminder", body: "Dear {student_name}, your {fee_type} of ₹{amount} is due on {due_date}. Please pay at the earliest." },
    { id: "2", name: "Exam Schedule", subject: "Exam Schedule Update", body: "Dear {student_name}, your {exam_type} for {subject} is scheduled on {date} at {time}. Room: {room}." },
    { id: "3", name: "Library Overdue", subject: "Library Book Overdue", body: "Dear {student_name}, your book \"{book_title}\" is overdue. Fine: ₹{fine}. Please return immediately." },
    { id: "4", name: "Attendance Alert", subject: "Low Attendance Alert", body: "Dear {student_name}, your attendance for {subject} is {percentage}%. Please attend classes regularly." },
  ]);

  const handleSave = async (section: string) => {
    setSaving(true);
    try {
      // Placeholder: save to college_settings table
      await new Promise((r) => setTimeout(r, 500));
      toast({ title: "Settings Saved", description: `${section} configuration updated`, variant: "success" });
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-sm text-muted-foreground">Configure SMS, Email, and WhatsApp notifications</p>
      </div>

      <Tabs defaultValue="email">
        <TabsList>
          <TabsTrigger value="sms"><Smartphone className="mr-2 h-4 w-4" /> SMS</TabsTrigger>
          <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4" /> Email</TabsTrigger>
          <TabsTrigger value="whatsapp"><MessageSquare className="mr-2 h-4 w-4" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="templates"><Bell className="mr-2 h-4 w-4" /> Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">SMS Configuration (MSG91)</CardTitle>
                  <CardDescription>Configure MSG91 SMS gateway for notifications</CardDescription>
                </div>
                <Switch checked={smsConfig.enabled} onCheckedChange={(v) => setSmsConfig({ ...smsConfig, enabled: v })} label="Enable SMS" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="MSG91 API Key" type="password" value={smsConfig.api_key} onChange={(e) => setSmsConfig({ ...smsConfig, api_key: e.target.value })} placeholder="Get from https://msg91.com" helperText="Sign up at msg91.com to get your API key" />
              <Input label="Sender ID" value={smsConfig.sender_id} onChange={(e) => setSmsConfig({ ...smsConfig, sender_id: e.target.value })} placeholder="e.g., TSR" />
              <Input label="Template ID" value={smsConfig.template_id} onChange={(e) => setSmsConfig({ ...smsConfig, template_id: e.target.value })} placeholder="Template ID from MSG91 dashboard" />
              <Button onClick={() => handleSave("SMS")} disabled={saving}>{saving ? "Saving..." : "Save SMS Settings"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Email Configuration (SMTP)</CardTitle>
                  <CardDescription>Configure SMTP settings for email notifications</CardDescription>
                </div>
                <Switch checked={emailConfig.enabled} onCheckedChange={(v) => setEmailConfig({ ...emailConfig, enabled: v })} label="Enable Email" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="SMTP Host" value={emailConfig.smtp_host} onChange={(e) => setEmailConfig({ ...emailConfig, smtp_host: e.target.value })} placeholder="smtp.gmail.com" />
                <Input label="SMTP Port" value={emailConfig.smtp_port} onChange={(e) => setEmailConfig({ ...emailConfig, smtp_port: e.target.value })} placeholder="587" />
                <Input label="SMTP Username" value={emailConfig.smtp_user} onChange={(e) => setEmailConfig({ ...emailConfig, smtp_user: e.target.value })} placeholder="your-email@gmail.com" />
                <Input label="SMTP Password" type="password" value={emailConfig.smtp_pass} onChange={(e) => setEmailConfig({ ...emailConfig, smtp_pass: e.target.value })} placeholder="App password" />
                <Input label="From Name" value={emailConfig.from_name} onChange={(e) => setEmailConfig({ ...emailConfig, from_name: e.target.value })} />
                <Input label="From Email" value={emailConfig.from_email} onChange={(e) => setEmailConfig({ ...emailConfig, from_email: e.target.value })} placeholder="noreply@example.com" />
              </div>
              <Switch checked={emailConfig.use_tls} onCheckedChange={(v) => setEmailConfig({ ...emailConfig, use_tls: v })} label="Use TLS" />
              <Button onClick={() => handleSave("Email")} disabled={saving}>{saving ? "Saving..." : "Save Email Settings"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">WhatsApp Business API</CardTitle>
                  <CardDescription>Configure WhatsApp Business API for notifications</CardDescription>
                </div>
                <Switch checked={whatsappConfig.enabled} onCheckedChange={(v) => setWhatsappConfig({ ...whatsappConfig, enabled: v })} label="Enable WhatsApp" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="API URL" value={whatsappConfig.api_url} onChange={(e) => setWhatsappConfig({ ...whatsappConfig, api_url: e.target.value })} placeholder="https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages" helperText="WhatsApp Business API endpoint URL" />
              <Input label="API Token" type="password" value={whatsappConfig.api_token} onChange={(e) => setWhatsappConfig({ ...whatsappConfig, api_token: e.target.value })} placeholder="Bearer token" />
              <Input label="Phone Number ID" value={whatsappConfig.phone_number_id} onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phone_number_id: e.target.value })} placeholder="From Meta Business Suite" />
              <Button onClick={() => handleSave("WhatsApp")} disabled={saving}>{saving ? "Saving..." : "Save WhatsApp Settings"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Templates</CardTitle>
              <CardDescription>Manage notification templates with variables</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates.map((tmpl) => (
                <div key={tmpl.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">{tmpl.name}</h4>
                  </div>
                  <Input label="Subject" value={tmpl.subject} onChange={(e) => setTemplates((prev) => prev.map((t) => t.id === tmpl.id ? { ...t, subject: e.target.value } : t))} />
                  <Textarea label="Body" value={tmpl.body} onChange={(e) => setTemplates((prev) => prev.map((t) => t.id === tmpl.id ? { ...t, body: e.target.value } : t))} helperText="Use {variable_name} for dynamic values" />
                </div>
              ))}
              <Button onClick={() => handleSave("Templates")} disabled={saving}>{saving ? "Saving..." : "Save Templates"}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
