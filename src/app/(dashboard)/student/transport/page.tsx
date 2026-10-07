"use client";

import * as React from "react";
import { Bus, MapPin, Clock, IndianRupee, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface TransportData {
  route_name: string;
  route_code: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  stop_name: string;
  arrival_time: string;
  departure_time: string;
  monthly_fee: number;
  allocation_date: string;
}

interface AvailableRoute {
  id: string;
  name: string;
  code: string;
  vehicle_number: string;
  capacity: number;
  monthly_fee: number;
}

export default function StudentTransportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);
  const [transportData, setTransportData] = React.useState<TransportData | null>(null);
  const [availableRoutes, setAvailableRoutes] = React.useState<AvailableRoute[]>([]);

  React.useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      try {
        const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single();
        if (!student) return;

        const { data: alloc } = await supabase
          .from("transport_allocations")
          .select(`
            allocation_date,
            route:transport_routes(name, code, vehicle_number, driver_name, driver_phone, monthly_fee),
            stop:transport_stops(name, arrival_time, departure_time)
          `)
          .eq("student_id", student.id)
          .eq("is_active", true)
          .single();

        if (alloc) {
          const route = alloc.route as Record<string, unknown> | null;
          const stop = alloc.stop as Record<string, unknown> | null;
          setTransportData({
            route_name: route?.name as string || "",
            route_code: route?.code as string || "",
            vehicle_number: route?.vehicle_number as string || "",
            driver_name: route?.driver_name as string || "",
            driver_phone: route?.driver_phone as string || "",
            stop_name: stop?.name as string || "",
            arrival_time: stop?.arrival_time as string || "",
            departure_time: stop?.departure_time as string || "",
            monthly_fee: route?.monthly_fee as number || 0,
            allocation_date: alloc.allocation_date,
          });
        }

        const { data: routes } = await supabase
          .from("transport_routes")
          .select("id, name, code, vehicle_number, capacity, monthly_fee")
          .eq("is_active", true);
        setAvailableRoutes((routes || []) as AvailableRoute[]);
      } catch {
        toast({ title: "Error", description: "Failed to load transport data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, supabase, toast]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading transport data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Transport</h1>
        <p className="text-sm text-muted-foreground">View your transport allocation and bus schedule</p>
      </div>

      {!transportData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bus className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">No transport allocation found</p>
            <p className="text-xs text-muted-foreground">Contact the admin to get transport allocated.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Route</p><p className="text-2xl font-bold">{transportData.route_code}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500"><Bus className="h-6 w-6 text-white" /></div></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Stop</p><p className="text-lg font-bold">{transportData.stop_name || "Direct"}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500"><MapPin className="h-6 w-6 text-white" /></div></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Vehicle</p><p className="text-sm font-bold">{transportData.vehicle_number}</p><p className="text-xs text-muted-foreground">{transportData.driver_name}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500"><Clock className="h-6 w-6 text-white" /></div></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Monthly Fee</p><p className="text-2xl font-bold">{formatCurrency(transportData.monthly_fee)}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500"><IndianRupee className="h-6 w-6 text-white" /></div></div></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Route Details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2"><span className="text-sm text-muted-foreground">Route Name</span><span className="text-sm font-medium">{transportData.route_name}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-sm text-muted-foreground">Bus Number</span><span className="text-sm font-medium">{transportData.vehicle_number}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-sm text-muted-foreground">Driver</span><span className="text-sm font-medium">{transportData.driver_name} ({transportData.driver_phone})</span></div>
                {transportData.stop_name && <div className="flex justify-between border-b pb-2"><span className="text-sm text-muted-foreground">My Stop</span><span className="text-sm font-medium">{transportData.stop_name}</span></div>}
                {transportData.arrival_time && <div className="flex justify-between"><span className="text-sm text-muted-foreground">Schedule</span><span className="text-sm font-medium">{transportData.arrival_time} → {transportData.departure_time}</span></div>}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Available Routes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {availableRoutes.map((route) => (
              <div key={route.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100"><Bus className="h-4 w-4 text-blue-600" /></div>
                  <div>
                    <p className="text-sm font-medium">{route.name} ({route.code})</p>
                    <p className="text-xs text-muted-foreground">{route.vehicle_number} · Capacity: {route.capacity}</p>
                  </div>
                </div>
                <Badge variant="secondary">{formatCurrency(route.monthly_fee)}/mo</Badge>
              </div>
            ))}
            {availableRoutes.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No routes available</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
