"use client";

import * as React from "react";
import {
  Bell,
  BellOff,
  CheckCheck,
  Filter,
  AlertCircle,
  Info,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDateTime, cn } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types";

const TYPE_OPTIONS = [
  { value: "info", label: "Info", icon: Info },
  { value: "warning", label: "Warning", icon: AlertTriangle },
  { value: "urgent", label: "Urgent", icon: AlertCircle },
  { value: "academic", label: "Academic", icon: GraduationCap },
  { value: "general", label: "General", icon: Bell },
];

const TYPE_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "warning" | "success"> = {
  info: "default",
  warning: "warning",
  urgent: "destructive",
  academic: "secondary",
  general: "secondary",
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [typeFilter, setTypeFilter] = React.useState("");
  const [unreadOnly, setUnreadOnly] = React.useState(false);

  const loadNotifications = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), per_page: "15" });
      if (typeFilter) params.set("type", typeFilter);
      if (unreadOnly) params.set("unread_only", "true");

      const res = await fetch(`/api/notifications?${params}`);
      const result = await res.json();
      if (result.success && result.data) {
        setNotifications(result.data.items);
        setTotal(result.data.total);
        setTotalPages(result.data.total_pages);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load notifications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, unreadOnly, toast]);

  React.useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const markRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", id }),
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast({ title: "Done", description: "All notifications marked as read", variant: "success" });
    } catch {
      toast({ title: "Error", description: "Failed", variant: "destructive" });
    }
  };

  const getIcon = (type: NotificationType) => {
    const opt = TYPE_OPTIONS.find((t) => t.value === type);
    const Icon = opt?.icon || Bell;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">View and manage your notifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">All Notifications ({total})</CardTitle>
            <div className="flex items-center gap-2">
              <select
                className="flex h-8 appearance-none rounded-md border border-input bg-transparent px-2 py-1 pr-6 text-sm"
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Types</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <Button
                variant={unreadOnly ? "default" : "outline"}
                size="sm"
                onClick={() => { setUnreadOnly(!unreadOnly); setPage(1); }}
              >
                <BellOff className="mr-1 h-3 w-3" />
                Unread
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No notifications</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4 transition-colors cursor-pointer hover:bg-accent/50",
                    !notif.is_read && "border-l-4 border-l-primary bg-primary/5"
                  )}
                  onClick={() => !notif.is_read && markRead(notif.id)}
                >
                  <div className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    notif.type === "urgent" ? "bg-red-100 text-red-600" :
                    notif.type === "warning" ? "bg-amber-100 text-amber-600" :
                    "bg-blue-100 text-blue-600"
                  )}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm", notif.is_read ? "font-normal" : "font-semibold")}>{notif.title}</p>
                      {!notif.is_read && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDateTime(notif.created_at)}</p>
                  </div>
                  <Badge variant={TYPE_BADGE_VARIANT[notif.type] || "secondary"}>
                    {notif.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
