"use client";

import * as React from "react";
import {
  Home,
  Users,
  Bed,
  Plus,
  UserMinus,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency, cn } from "@/lib/utils";

interface BlockInfo {
  id: string;
  name: string;
  type: string;
  total_rooms: number;
  warden_name: string | null;
}

interface RoomInfo {
  id: string;
  block_id: string;
  block: { id: string; name: string; type: string } | null;
  room_number: string;
  floor: number;
  capacity: number;
  occupied: number;
  room_type: string;
  has_ac: boolean;
  monthly_rent: number;
}

interface AllocationInfo {
  id: string;
  student_id: string;
  student: { roll_number: string; user: { full_name: string } | null } | null;
  room_id: string;
  room: { room_number: string; block: { name: string } | null } | null;
  allocation_date: string;
}

interface Stats {
  blocks: BlockInfo[];
  total_rooms: number;
  total_capacity: number;
  total_occupied: number;
  total_allocations: number;
  occupancy_rate: number;
}

export default function HostelManagementPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [rooms, setRooms] = React.useState<RoomInfo[]>([]);
  const [allocations, setAllocations] = React.useState<AllocationInfo[]>([]);
  const [filterBlock, setFilterBlock] = React.useState("");

  const [blockFormOpen, setBlockFormOpen] = React.useState(false);
  const [roomFormOpen, setRoomFormOpen] = React.useState(false);
  const [allocateOpen, setAllocateOpen] = React.useState(false);
  const [deallocateId, setDeallocateId] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);

  const [blockForm, setBlockForm] = React.useState({ name: "", type: "boys" as "boys" | "girls", total_rooms: 0, warden_name: "", warden_phone: "", description: "" });
  const [roomForm, setRoomForm] = React.useState({ block_id: "", room_number: "", floor: 0, capacity: 2, room_type: "double", has_ac: false, monthly_rent: 0 });
  const [allocForm, setAllocForm] = React.useState({ student_roll: "", room_id: "", student_id: "" });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, roomsRes, allocsRes] = await Promise.all([
        fetch("/api/hostel?action=stats"),
        fetch(`/api/hostel?action=rooms${filterBlock ? `&block_id=${filterBlock}` : ""}`),
        fetch("/api/hostel?action=allocations"),
      ]);

      const [statsResult, roomsResult, allocsResult] = await Promise.all([
        statsRes.json(),
        roomsRes.json(),
        allocsRes.json(),
      ]);

      if (statsResult.success) setStats(statsResult.data);
      if (roomsResult.success) setRooms(roomsResult.data || []);
      if (allocsResult.success) setAllocations(allocsResult.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load hostel data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filterBlock, toast]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const handleAddBlock = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_block", ...blockForm }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Block Added", description: result.message, variant: "success" });
      setBlockFormOpen(false);
      setBlockForm({ name: "", type: "boys", total_rooms: 0, warden_name: "", warden_phone: "", description: "" });
      loadData();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleAddRoom = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_room", ...roomForm }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Room Added", description: result.message, variant: "success" });
      setRoomFormOpen(false);
      loadData();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleAllocate = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/hostel/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "allocate", student_id: allocForm.student_id, room_id: allocForm.room_id }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Allocated", description: result.message, variant: "success" });
      setAllocateOpen(false);
      setAllocForm({ student_roll: "", room_id: "", student_id: "" });
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
      const res = await fetch("/api/hostel/allocate", {
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
    const { data } = await supabase
      .from("students")
      .select("id, roll_number")
      .eq("roll_number", roll)
      .eq("is_active", true)
      .single();
    if (data) {
      setAllocForm((prev) => ({ ...prev, student_id: data.id, student_roll: data.roll_number }));
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading hostel data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hostel Management</h1>
          <p className="text-sm text-muted-foreground">Manage blocks, rooms, and allocations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAllocateOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Allocate
          </Button>
          <Button onClick={() => setRoomFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Room
          </Button>
          <Button variant="outline" onClick={() => setBlockFormOpen(true)}>
            <Building2 className="mr-2 h-4 w-4" />
            Add Block
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Rooms</p>
                  <p className="text-2xl font-bold">{stats.total_rooms}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
                  <Bed className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="text-2xl font-bold">{stats.total_capacity}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500">
                  <Home className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Occupied</p>
                  <p className="text-2xl font-bold">{stats.total_occupied}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                  <p className="text-2xl font-bold">{stats.occupancy_rate}%</p>
                </div>
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", stats.occupancy_rate > 80 ? "bg-red-500" : "bg-emerald-500")}>
                  {stats.occupancy_rate > 80 ? <AlertTriangle className="h-6 w-6 text-white" /> : <Home className="h-6 w-6 text-white" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Rooms</CardTitle>
              <Select
                value={filterBlock}
                onChange={(e) => setFilterBlock(e.target.value)}
                options={(stats?.blocks || []).map((b) => ({ value: b.id, label: b.name }))}
                placeholder="All Blocks"
                className="w-[180px]"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {rooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", room.occupied >= room.capacity ? "bg-red-100" : "bg-emerald-100")}>
                      <Bed className={cn("h-5 w-5", room.occupied >= room.capacity ? "text-red-600" : "text-emerald-600")} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Room {room.room_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {room.block?.name} · Floor {room.floor} · {room.room_type} · {room.has_ac ? "AC" : "Non-AC"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={room.occupied >= room.capacity ? "destructive" : room.occupied > 0 ? "warning" : "success"}>
                      {room.occupied}/{room.capacity}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{formatCurrency(room.monthly_rent)}/mo</p>
                  </div>
                </div>
              ))}
              {rooms.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No rooms found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {allocations.map((alloc) => (
                <div key={alloc.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{alloc.student?.user?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{alloc.student?.roll_number}</p>
                      <p className="text-xs text-muted-foreground">
                        Room {alloc.room?.room_number} · {alloc.room?.block?.name}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setDeallocateId(alloc.id)}>
                      <UserMinus className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {allocations.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No active allocations</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Block Dialog */}
      <Dialog open={blockFormOpen} onOpenChange={setBlockFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Hostel Block</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input label="Block Name" value={blockForm.name} onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })} placeholder="e.g., Block A" />
            <Select label="Type" value={blockForm.type} onChange={(e) => setBlockForm({ ...blockForm, type: e.target.value as "boys" | "girls" })} options={[{ value: "boys", label: "Boys" }, { value: "girls", label: "Girls" }]} />
            <Input label="Total Rooms" type="number" value={blockForm.total_rooms} onChange={(e) => setBlockForm({ ...blockForm, total_rooms: parseInt(e.target.value) || 0 })} />
            <Input label="Warden Name" value={blockForm.warden_name} onChange={(e) => setBlockForm({ ...blockForm, warden_name: e.target.value })} />
            <Input label="Warden Phone" value={blockForm.warden_phone} onChange={(e) => setBlockForm({ ...blockForm, warden_phone: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockFormOpen(false)} disabled={processing}>Cancel</Button>
            <Button onClick={handleAddBlock} disabled={processing}>{processing ? "Adding..." : "Add Block"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={roomFormOpen} onOpenChange={setRoomFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Room</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select label="Block" value={roomForm.block_id} onChange={(e) => setRoomForm({ ...roomForm, block_id: e.target.value })} options={(stats?.blocks || []).map((b) => ({ value: b.id, label: b.name }))} placeholder="Select block" />
            <Input label="Room Number" value={roomForm.room_number} onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })} placeholder="e.g., 101" />
            <Input label="Floor" type="number" value={roomForm.floor} onChange={(e) => setRoomForm({ ...roomForm, floor: parseInt(e.target.value) || 0 })} />
            <Input label="Capacity" type="number" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 2 })} />
            <Select label="Room Type" value={roomForm.room_type} onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })} options={[{ value: "single", label: "Single" }, { value: "double", label: "Double" }, { value: "triple", label: "Triple" }, { value: "shared", label: "Shared" }]} />
            <Input label="Monthly Rent (₹)" type="number" value={roomForm.monthly_rent} onChange={(e) => setRoomForm({ ...roomForm, monthly_rent: parseInt(e.target.value) || 0 })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomFormOpen(false)} disabled={processing}>Cancel</Button>
            <Button onClick={handleAddRoom} disabled={processing}>{processing ? "Adding..." : "Add Room"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocate Dialog */}
      <Dialog open={allocateOpen} onOpenChange={setAllocateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Allocate Room</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input label="Student Roll Number" value={allocForm.student_roll} onChange={(e) => setAllocForm({ ...allocForm, student_roll: e.target.value })} onBlur={() => searchStudent(allocForm.student_roll)} placeholder="Enter roll number" />
            {allocForm.student_id && <p className="text-xs text-emerald-600">Student found: {allocForm.student_roll}</p>}
            <Select label="Room" value={allocForm.room_id} onChange={(e) => setAllocForm({ ...allocForm, room_id: e.target.value })} options={rooms.filter((r) => r.occupied < r.capacity).map((r) => ({ value: r.id, label: `${r.block?.name} - Room ${r.room_number} (${r.occupied}/${r.capacity})` }))} placeholder="Select room" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllocateOpen(false)} disabled={processing}>Cancel</Button>
            <Button onClick={handleAllocate} disabled={processing || !allocForm.student_id || !allocForm.room_id}>{processing ? "Allocating..." : "Allocate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deallocate Confirm */}
      <Dialog open={!!deallocateId} onOpenChange={() => setDeallocateId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Deallocation</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to deallocate this student from their room?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeallocateId(null)} disabled={processing}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeallocate} disabled={processing}>{processing ? "Processing..." : "Deallocate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
