"use client";

import * as React from "react";
import {
  Bus,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Users,
  IndianRupee,
  UserMinus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/forms/SearchInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface RouteData {
  id: string;
  name: string;
  code: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  capacity: number;
  monthly_fee: number;
}

interface StopData {
  id: string;
  name: string;
  sequence: number;
  arrival_time: string;
  departure_time: string;
  landmark: string | null;
}

interface AllocationData {
  id: string;
  student: { roll_number: string; user: { full_name: string } | null } | null;
  route: { id: string; name: string; code: string } | null;
  stop: { name: string } | null;
}

interface Stats {
  total_routes: number;
  total_capacity: number;
  total_allocated: number;
  available_seats: number;
}

export default function TransportManagementPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);
  const [routes, setRoutes] = React.useState<RouteData[]>([]);
  const [allocations, setAllocations] = React.useState<AllocationData[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [search, setSearch] = React.useState("");
  const [routeFormOpen, setRouteFormOpen] = React.useState(false);
  const [editingRoute, setEditingRoute] = React.useState<RouteData | null>(null);
  const [allocateOpen, setAllocateOpen] = React.useState(false);
  const [deallocateId, setDeallocateId] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);

  const [routeForm, setRouteForm] = React.useState({
    name: "", code: "", vehicle_number: "", driver_name: "", driver_phone: "",
    capacity: 40, monthly_fee: 0,
  });
  const [stopsForm, setStopsForm] = React.useState<{ name: string; arrival_time: string; departure_time: string; landmark: string }[]>([
    { name: "", arrival_time: "", departure_time: "", landmark: "" },
  ]);
  const [allocForm, setAllocForm] = React.useState({ student_roll: "", student_id: "", route_id: "", stop_id: "" });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "50" });
      if (search) params.set("search", search);

      const [routesRes, statsRes, allocsRes] = await Promise.all([
        fetch(`/api/transport?${params}`),
        fetch("/api/transport?action=stats"),
        fetch("/api/transport?action=allocations"),
      ]);

      const [routesResult, statsResult, allocsResult] = await Promise.all([
        routesRes.json(), statsRes.json(), allocsRes.json(),
      ]);

      if (routesResult.success && routesResult.data) setRoutes(routesResult.data.items);
      if (statsResult.success) setStats(statsResult.data);
      if (allocsResult.success) setAllocations(allocsResult.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load transport data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const handleSaveRoute = async () => {
    setProcessing(true);
    try {
      const payload = {
        action: editingRoute ? "update_route" : "add_route",
        ...(editingRoute ? { id: editingRoute.id } : {}),
        ...routeForm,
        stops: stopsForm.filter((s) => s.name),
      };
      const res = await fetch("/api/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: editingRoute ? "Route Updated" : "Route Added", description: result.message, variant: "success" });
      setRouteFormOpen(false);
      setEditingRoute(null);
      setRouteForm({ name: "", code: "", vehicle_number: "", driver_name: "", driver_phone: "", capacity: 40, monthly_fee: 0 });
      setStopsForm([{ name: "", arrival_time: "", departure_time: "", landmark: "" }]);
      loadData();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    try {
      const res = await fetch("/api/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_route", id }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Route Deleted", description: result.message, variant: "success" });
      loadData();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  const handleAllocate = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/transport/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "allocate", ...allocForm }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Allocated", description: result.message, variant: "success" });
      setAllocateOpen(false);
      setAllocForm({ student_roll: "", student_id: "", route_id: "", stop_id: "" });
      loadData();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeallocate = async () => {
    if (!deallocateId) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/transport/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deallocate", allocation_id: deallocateId }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Deallocated", description: result.message, variant: "success" });
      setDeallocateId(null);
      loadData();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const searchStudent = async (roll: string) => {
    if (roll.length < 3) return;
    const { data } = await supabase.from("students").select("id, roll_number").eq("roll_number", roll).eq("is_active", true).single();
    if (data) setAllocForm((prev) => ({ ...prev, student_id: data.id, student_roll: data.roll_number }));
  };

  const selectedRouteStops = React.useMemo(() => {
    if (!allocForm.route_id) return [];
    return routes.filter((r) => r.id === allocForm.route_id);
  }, [allocForm.route_id, routes]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transport Management</h1>
          <p className="text-sm text-muted-foreground">Manage routes, stops, and student allocations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAllocateOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Allocate
          </Button>
          <Button onClick={() => { setEditingRoute(null); setRouteFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Route
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Routes</p><p className="text-2xl font-bold">{stats.total_routes}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500"><Bus className="h-6 w-6 text-white" /></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Capacity</p><p className="text-2xl font-bold">{stats.total_capacity}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500"><Users className="h-6 w-6 text-white" /></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Allocated</p><p className="text-2xl font-bold">{stats.total_allocated}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500"><MapPin className="h-6 w-6 text-white" /></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Available Seats</p><p className="text-2xl font-bold text-emerald-600">{stats.available_seats}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500"><Bus className="h-6 w-6 text-white" /></div></div></CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Routes</CardTitle>
            <SearchInput value={search} onChange={setSearch} placeholder="Search routes..." className="w-[250px]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {routes.map((route) => (
              <div key={route.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Bus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{route.name} ({route.code})</p>
                    <p className="text-xs text-muted-foreground">
                      {route.vehicle_number} · Driver: {route.driver_name} · {route.driver_phone}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fee: {formatCurrency(route.monthly_fee)}/month · Capacity: {route.capacity}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingRoute(route);
                    setRouteForm({ name: route.name, code: route.code, vehicle_number: route.vehicle_number, driver_name: route.driver_name, driver_phone: route.driver_phone, capacity: route.capacity, monthly_fee: route.monthly_fee });
                    setRouteFormOpen(true);
                  }}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteRoute(route.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {routes.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No routes found</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Student Allocations</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Student</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Route</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Stop</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">Action</th>
              </tr></thead>
              <tbody>
                {allocations.map((alloc) => (
                  <tr key={alloc.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{alloc.student?.user?.full_name || "Unknown"} ({alloc.student?.roll_number})</td>
                    <td className="px-3 py-2">{alloc.route?.name} ({alloc.route?.code})</td>
                    <td className="px-3 py-2">{alloc.stop?.name}</td>
                    <td className="px-3 py-2 text-center">
                      <Button variant="ghost" size="icon" onClick={() => setDeallocateId(alloc.id)}>
                        <UserMinus className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {allocations.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No allocations</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Route Form Dialog */}
      <Dialog open={routeFormOpen} onOpenChange={setRouteFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingRoute ? "Edit Route" : "Add Route"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Route Name" value={routeForm.name} onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })} placeholder="e.g., Route A - City" />
              <Input label="Route Code" value={routeForm.code} onChange={(e) => setRouteForm({ ...routeForm, code: e.target.value })} placeholder="e.g., RA01" />
              <Input label="Vehicle Number" value={routeForm.vehicle_number} onChange={(e) => setRouteForm({ ...routeForm, vehicle_number: e.target.value })} placeholder="e.g., MH-12-AB-1234" />
              <Input label="Driver Name" value={routeForm.driver_name} onChange={(e) => setRouteForm({ ...routeForm, driver_name: e.target.value })} />
              <Input label="Driver Phone" value={routeForm.driver_phone} onChange={(e) => setRouteForm({ ...routeForm, driver_phone: e.target.value })} />
              <Input label="Capacity" type="number" value={routeForm.capacity} onChange={(e) => setRouteForm({ ...routeForm, capacity: parseInt(e.target.value) || 40 })} />
              <Input label="Monthly Fee (₹)" type="number" value={routeForm.monthly_fee} onChange={(e) => setRouteForm({ ...routeForm, monthly_fee: parseInt(e.target.value) || 0 })} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Stops</p>
              {stopsForm.map((stop, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2">
                  <Input placeholder="Stop name" value={stop.name} onChange={(e) => { const s = [...stopsForm]; s[idx].name = e.target.value; setStopsForm(s); }} />
                  <Input type="time" value={stop.arrival_time} onChange={(e) => { const s = [...stopsForm]; s[idx].arrival_time = e.target.value; setStopsForm(s); }} />
                  <Input type="time" value={stop.departure_time} onChange={(e) => { const s = [...stopsForm]; s[idx].departure_time = e.target.value; setStopsForm(s); }} />
                  <Input placeholder="Landmark" value={stop.landmark} onChange={(e) => { const s = [...stopsForm]; s[idx].landmark = e.target.value; setStopsForm(s); }} />
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setStopsForm([...stopsForm, { name: "", arrival_time: "", departure_time: "", landmark: "" }])}>
                <Plus className="mr-1 h-3 w-3" /> Add Stop
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRouteFormOpen(false)} disabled={processing}>Cancel</Button>
            <Button onClick={handleSaveRoute} disabled={processing}>{processing ? "Saving..." : editingRoute ? "Update Route" : "Add Route"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocate Dialog */}
      <Dialog open={allocateOpen} onOpenChange={setAllocateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Allocate Transport</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input label="Student Roll Number" value={allocForm.student_roll} onChange={(e) => setAllocForm({ ...allocForm, student_roll: e.target.value })} onBlur={() => searchStudent(allocForm.student_roll)} placeholder="Enter roll number" />
            {allocForm.student_id && <p className="text-xs text-emerald-600">Student found: {allocForm.student_roll}</p>}
            <div className="w-full space-y-1.5">
              <label className="text-sm font-medium">Route</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={allocForm.route_id} onChange={(e) => setAllocForm({ ...allocForm, route_id: e.target.value, stop_id: "" })}>
                <option value="">Select route</option>
                {routes.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
              </select>
            </div>
            {allocForm.route_id && (
              <div className="w-full space-y-1.5">
                <label className="text-sm font-medium">Stop</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={allocForm.stop_id} onChange={(e) => setAllocForm({ ...allocForm, stop_id: e.target.value })}>
                  <option value="">Select stop</option>
                  <option value="direct">Direct (No specific stop)</option>
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllocateOpen(false)} disabled={processing}>Cancel</Button>
            <Button onClick={handleAllocate} disabled={processing || !allocForm.student_id || !allocForm.route_id}>{processing ? "Allocating..." : "Allocate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deallocateId} onOpenChange={() => setDeallocateId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Deallocation</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Remove student from transport route?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeallocateId(null)} disabled={processing}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeallocate} disabled={processing}>{processing ? "Processing..." : "Deallocate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
