"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Mail, CheckCircle, XCircle, Send, ExternalLink, Shield } from "lucide-react";

export default function EmailSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [saved, setSaved] = useState(false);

  const [config, setConfig] = useState({
    smtp_user: "",
    smtp_pass: "",
    email_from_name: "TSR CMS",
  });

  const handleSave = () => {
    if (!config.smtp_user || !config.smtp_pass) {
      toast({ title: "Error", description: "Please fill in Gmail and App Password", variant: "destructive" });
      return;
    }

    setLoading(true);

    fetch("/api/settings/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSaved(true);
          toast({ title: "Saved!", description: "Email configuration saved. Restart the app to apply." });
        } else {
          toast({ title: "Error", description: data.error || "Failed to save", variant: "destructive" });
        }
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to save configuration", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  };

  const handleTest = () => {
    if (!testEmail) {
      toast({ title: "Error", description: "Enter an email to send test to", variant: "destructive" });
      return;
    }

    setTesting(true);
    setTestResult(null);

    fetch("/api/settings/email/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: testEmail }),
    })
      .then((r) => r.json())
      .then((data) => {
        setTestResult(data);
        if (data.success) {
          toast({ title: "Email Sent!", description: "Check your inbox for the test email" });
        } else {
          toast({ title: "Failed", description: data.message || data.error, variant: "destructive" });
        }
      })
      .catch(() => {
        setTestResult({ success: false, message: "Failed to connect to server" });
      })
      .finally(() => setTesting(false));
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Settings</h1>
        <p className="text-muted-foreground">Configure Gmail to send emails from TSR CMS</p>
      </div>

      {/* Gmail Setup Guide */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Shield className="h-5 w-5" />
            How to Set Up Gmail (2 Minutes)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-900">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Go to{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium inline-flex items-center gap-1"
              >
                Google App Passwords <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>Sign in with your Gmail account if prompted</li>
            <li>
              At the bottom, type <strong>TSR CMS</strong> and click <strong>Create</strong>
            </li>
            <li>Google will show a 16-character password like: <code className="bg-blue-100 px-1 rounded">abcd efgh ijkl mnop</code></li>
            <li>Copy that password and paste it in the App Password field below</li>
            <li><strong>Note:</strong> Remove spaces from the password before pasting</li>
          </ol>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail Configuration
          </CardTitle>
          <CardDescription>Enter your Gmail credentials to enable email sending</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="smtp_user">Gmail Address *</Label>
            <Input
              id="smtp_user"
              type="email"
              placeholder="your-email@gmail.com"
              value={config.smtp_user}
              onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp_pass">App Password (16 characters) *</Label>
            <Input
              id="smtp_pass"
              type="password"
              placeholder="abcdefghijklmnop"
              value={config.smtp_pass}
              onChange={(e) => setConfig({ ...config, smtp_pass: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              This is NOT your regular Gmail password. Get it from{" "}
              <a href="https://myaccount.google.com/apppasswords" target="_blank" className="underline" rel="noopener noreferrer">
                Google App Passwords
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="from_name">Sender Name</Label>
            <Input
              id="from_name"
              placeholder="TSR CMS"
              value={config.email_from_name}
              onChange={(e) => setConfig({ ...config, email_from_name: e.target.value })}
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Configuration"}
            </Button>
            {saved && (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Saved
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Test Email
          </CardTitle>
          <CardDescription>Verify your email configuration by sending a test email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="test-email@gmail.com"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleTest} disabled={testing || !testEmail}>
              {testing ? "Sending..." : "Send Test"}
            </Button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-md text-sm ${
                testResult.success
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                {testResult.message}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Setup Alternative */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-amber-800 text-sm">Manual Setup Alternative</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-900 space-y-2">
          <p>If you prefer, you can also set Gmail directly in <code className="bg-amber-100 px-1 rounded">.env.local</code>:</p>
          <pre className="bg-amber-100 p-2 rounded text-xs overflow-x-auto">
{`SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop`}
          </pre>
          <p>Then restart the app with <code className="bg-amber-100 px-1 rounded">npm run dev</code></p>
        </CardContent>
      </Card>
    </div>
  );
}
