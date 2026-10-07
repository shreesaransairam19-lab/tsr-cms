"use client";

import * as React from "react";
import {
  Calendar,
  CalendarDays,
  Clock,
  MapPin,
  LayoutGrid,
  List,
  ClipboardCheck,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface TimetableEntry {
  id: string;
  department_id: string | null;
  program_id: string | null;
  semester: number | null;
  faculty_user_id: string;
  subject: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  section: string | null;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const WEEK_DAYS = [1, 2, 3, 4, 5, 6];

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

const SUBJECT_STYLES = [
  { border: "border-l-blue-500", bg: "bg-blue-500/10 dark:bg-blue-500/15", chip: "text-blue-700 dark:text-blue-300" },
  { border: "border-l-emerald-500", bg: "bg-emerald-500/10 dark:bg-emerald-500/15", chip: "text-emerald-700 dark:text-emerald-300" },
  { border: "border-l-violet-500", bg: "bg-violet-500/10 dark:bg-violet-500/15", chip: "text-violet-700 dark:text-violet-300" },
  { border: "border-l-amber-500", bg: "bg-amber-500/10 dark:bg-amber-500/15", chip: "text-amber-700 dark:text-amber-300" },
  { border: "border-l-rose-500", bg: "bg-rose-500/10 dark:bg-rose-500/15", chip: "text-rose-700 dark:text-rose-300" },
  { border: "border-l-cyan-500", bg: "bg-cyan-500/10 dark:bg-cyan-500/15", chip: "text-cyan-700 dark:text-cyan-300" },
];

function subjectStyle(subject: string) {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = (hash * 31 + subject.charCodeAt(i)) | 0;
  }
  return SUBJECT_STYLES[Math.abs(hash) % SUBJECT_STYLES.length];
}

function hourOf(time: string): number {
  return parseInt(time.split(":")[0] || "0", 10);
}

function formatTime(time: string): string {
  const parts = time.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  if (isNaN(h)) return time;
  const ampm = h >= 12 ? "PM" : "AM";
  const hr12 = h % 12 === 0 ? 12 : h % 12;
  return `${hr12}:${m} ${ampm}`;
}

function formatHourLabel(hour: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const hr12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hr12} ${ampm}`;
}

function ClassCard({ entry }: { entry: TimetableEntry }) {
  const style = subjectStyle(entry.subject);
  return (
    <div className={cn("rounded-lg border border-border/60 border-l-4 p-3 shadow-sm transition-colors hover:border-foreground/20", style.bg, style.border)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug">{entry.subject}</p>
        {entry.section && <Badge variant="secondary" className="shrink-0">{entry.section}</Badge>}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTime(entry.start_time)} – {formatTime(entry.end_time)}
        </span>
        {entry.room && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Room {entry.room}
          </span>
        )}
        {entry.semester != null && (
          <span className={cn("font-medium", style.chip)}>Semester {entry.semester}</span>
        )}
      </div>
    </div>
  );
}

function MiniClassCard({ entry }: { entry: TimetableEntry }) {
  const style = subjectStyle(entry.subject);
  return (
    <div className={cn("rounded-md border border-border/60 border-l-[3px] p-2", style.bg, style.border)}>
      <p className="truncate text-xs font-semibold leading-tight" title={entry.subject}>
        {entry.subject}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
        {formatTime(entry.start_time)} – {formatTime(entry.end_time)}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {entry.room && (
          <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" />
            {entry.room}
          </span>
        )}
        {entry.section && (
          <Badge variant="secondary" className="px-1 py-0 text-[10px]">{entry.section}</Badge>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
      <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/70">Enjoy the free time!</p>
    </div>
  );
}

export default function TimetablePage() {
  const { user, role, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = React.useState<TimetableEntry[]>([]);
  const [attendanceRecords, setAttendanceRecords] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [view, setView] = React.useState("daily");

  const today = new Date();
  const todayDow = today.getDay();

  React.useEffect(() => {
    async function loadTimetable() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (role === "faculty" && user?.id) {
          params.set("faculty_user_id", user.id);
        }
        const res = await fetch(`/api/timetable?${params.toString()}`);
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || "Failed to load timetable");
        }
        setEntries(json.data.items as TimetableEntry[]);

        if (role === "faculty" && user?.id) {
          const supabase = getSupabaseBrowserClient();
          const { data: attData } = await supabase
            .from("attendance")
            .select("id, date, subject, total_students, present_count, absent_count, status")
            .eq("faculty_user_id", user.id)
            .order("date", { ascending: false })
            .limit(30);
          setAttendanceRecords(attData || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load timetable");
        setEntries([]);
      } finally {
        setLoading(false);
      }
    }

    if (authLoading) return;
    loadTimetable();
  }, [authLoading, role, user?.id]);

  const todayEntries = entries
    .filter((e) => e.day_of_week === todayDow)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const weekEntries = entries.filter((e) => e.day_of_week >= 1 && e.day_of_week <= 6);

  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Calendar className="h-6 w-6 text-primary" />
            {role === "faculty" ? "My Timetable" : "Timetable"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{dateLabel}</p>
        </div>
        {!loading && !error && (
          <div className="flex gap-3">
            <Card className="min-w-28 px-4 py-2.5">
              <p className="text-xl font-semibold leading-none">{todayEntries.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Classes today</p>
            </Card>
            <Card className="min-w-28 px-4 py-2.5">
              <p className="text-xl font-semibold leading-none">{weekEntries.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">This week</p>
            </Card>
          </div>
        )}
      </div>

      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="daily" className="gap-1.5">
            <List className="h-3.5 w-3.5" />
            Daily
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-1.5">
            <LayoutGrid className="h-3.5 w-3.5" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Attendance
          </TabsTrigger>
        </TabsList>

        {loading || authLoading ? (
          <div className="mt-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <Card className="mt-4 border-destructive/50">
            <CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : (
          <>
            <TabsContent value="daily" className="mt-4">
              {todayEntries.length === 0 ? (
                <EmptyState title="No classes today" />
              ) : (
                <Card>
                  <CardContent className="p-5">
                    <div className="space-y-1">
                      {HOURS.map((hour) => {
                        const slotClasses = todayEntries.filter(
                          (e) => hourOf(e.start_time) === hour
                        );
                        if (slotClasses.length === 0) {
                          return (
                            <div key={hour} className="flex gap-4">
                              <div className="w-16 shrink-0 pt-2 text-right">
                                <span className="text-[11px] font-medium text-muted-foreground/60">
                                  {formatHourLabel(hour)}
                                </span>
                              </div>
                              <div className="relative flex-1 border-l border-dashed border-border/70 pb-5 pl-5">
                                <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full border border-border bg-background" />
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={hour} className="flex gap-4">
                            <div className="w-16 shrink-0 pt-3 text-right">
                              <span className="text-xs font-semibold text-foreground">
                                {formatHourLabel(hour)}
                              </span>
                            </div>
                            <div className="relative flex-1 border-l-2 border-primary/30 pb-5 pl-5">
                              <span className="absolute -left-[7px] top-4 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                              <div className="space-y-2">
                                {slotClasses.map((entry) => (
                                  <ClassCard key={entry.id} entry={entry} />
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="weekly" className="mt-4">
              {weekEntries.length === 0 ? (
                <EmptyState title="No classes this week" />
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <div className="min-w-[860px]">
                        <div className="grid grid-cols-[80px_repeat(6,minmax(0,1fr))] border-b bg-muted/50">
                          <div className="flex items-center justify-end px-3 py-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Time
                          </div>
                          {WEEK_DAYS.map((day) => (
                            <div
                              key={day}
                              className={cn(
                                "border-l px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide",
                                day === todayDow
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground"
                              )}
                            >
                              {DAY_NAMES[day]}
                              {day === todayDow && (
                                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />
                              )}
                            </div>
                          ))}
                        </div>
                        {HOURS.map((hour) => (
                          <div
                            key={hour}
                            className="grid grid-cols-[80px_repeat(6,minmax(0,1fr))] border-b last:border-b-0"
                          >
                            <div className="flex items-start justify-end px-3 pt-2.5 text-[11px] font-medium text-muted-foreground">
                              {formatHourLabel(hour)}
                            </div>
                            {WEEK_DAYS.map((day) => {
                              const cellEntries = entries.filter(
                                (e) => e.day_of_week === day && hourOf(e.start_time) === hour
                              );
                              return (
                                <div
                                  key={day}
                                  className={cn(
                                    "min-h-[68px] space-y-1.5 border-l p-1.5",
                                    day === todayDow && "bg-primary/5"
                                  )}
                                >
                                  {cellEntries.map((entry) => (
                                    <MiniClassCard key={entry.id} entry={entry} />
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="attendance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Attendance Records</CardTitle>
                </CardHeader>
                <CardContent>
                  {attendanceRecords.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                      <ClipboardCheck className="h-10 w-10 opacity-40" />
                      <p className="text-sm font-medium">No attendance records yet</p>
                      <p className="text-xs">Start marking attendance to see records here</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {attendanceRecords.map((att) => {
                        const pct = att.total_students > 0
                          ? Math.round((att.present_count / att.total_students) * 100)
                          : 0;
                        const color =
                          pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-600";
                        return (
                          <div key={att.id} className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-3">
                              <div className={cn("flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold", pct >= 80 ? "bg-emerald-500/10 text-emerald-600" : pct >= 60 ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600")}>
                                {pct}%
                              </div>
                              <div>
                                <p className="text-sm font-medium">{att.subject || "General"}</p>
                                <p className="text-xs text-muted-foreground">{att.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <CheckCircle2 className="h-3 w-3" /> {att.present_count} present
                              </span>
                              <span className="inline-flex items-center gap-1 text-red-500">
                                <AlertCircle className="h-3 w-3" /> {att.absent_count} absent
                              </span>
                              <span className="text-muted-foreground">{att.total_students} total</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
