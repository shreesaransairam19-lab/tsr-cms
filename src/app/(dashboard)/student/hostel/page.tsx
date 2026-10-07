"use client";

import * as React from "react";
import { Home, Bed, Calendar, IndianRupee, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate, formatCurrency } from "@/lib/utils";

interface HostelData {
  allocation_id: string;
  allocation_date: string;
  room_number: string;
  floor: number;
  block_name: string;
  block_type: string;
  room_type: string;
  has_ac: boolean;
  monthly_rent: number;
  capacity: number;
  warden_name: string | null;
  warden_phone: string | null;
}

export default function StudentHostelPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);
  const [hostelData, setHostelData] = React.useState<HostelData | null>(null);

  React.useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      try {
        const { data: student } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!student) return;

        const { data: allocation } = await supabase
          .from("hostel_allocations")
          .select(`
            id,
            allocation_date,
            room:hostel_rooms(
              room_number, floor, capacity, room_type, has_ac, monthly_rent,
              block:hostel_blocks(name, type, warden_name, warden_phone)
            )
          `)
          .eq("student_id", student.id)
          .eq("is_active", true)
          .single();

        if (!allocation) {
          setHostelData(null);
          return;
        }

        const room = allocation.room as Record<string, unknown> | null;
        const block = room?.block as Record<string, unknown> | null;

        setHostelData({
          allocation_id: allocation.id,
          allocation_date: allocation.allocation_date,
          room_number: room?.room_number as string,
          floor: room?.floor as number,
          block_name: block?.name as string,
          block_type: block?.type as string,
          room_type: room?.room_type as string,
          has_ac: room?.has_ac as boolean,
          monthly_rent: room?.monthly_rent as number,
          capacity: room?.capacity as number,
          warden_name: block?.warden_name as string | null,
          warden_phone: block?.warden_phone as string | null,
        });
      } catch {
        toast({ title: "Error", description: "Failed to load hostel data", variant: "destructive" });
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
          <p className="text-sm text-muted-foreground">Loading hostel details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Hostel</h1>
        <p className="text-sm text-muted-foreground">View your hostel allocation details</p>
      </div>

      {!hostelData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Home className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">No hostel allocation found</p>
            <p className="text-xs text-muted-foreground">Contact the admin to get a hostel room allocated.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Block</p>
                    <p className="text-2xl font-bold">{hostelData.block_name}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
                    <Home className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Room</p>
                    <p className="text-2xl font-bold">{hostelData.room_number}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500">
                    <Bed className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Floor</p>
                    <p className="text-2xl font-bold">{hostelData.floor}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Rent</p>
                    <p className="text-2xl font-bold">{formatCurrency(hostelData.monthly_rent)}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
                    <IndianRupee className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Room Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">Block Type</span>
                    <span className="text-sm font-medium capitalize">{hostelData.block_type}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">Room Type</span>
                    <span className="text-sm font-medium capitalize">{hostelData.room_type}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">AC</span>
                    <Badge variant={hostelData.has_ac ? "success" : "secondary"}>
                      {hostelData.has_ac ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">Capacity</span>
                    <span className="text-sm font-medium">{hostelData.capacity} students</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Allocation Date</span>
                    <span className="text-sm font-medium">{formatDate(hostelData.allocation_date)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Warden Information</CardTitle>
              </CardHeader>
              <CardContent>
                {hostelData.warden_name ? (
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-sm text-muted-foreground">Name</span>
                      <span className="text-sm font-medium">{hostelData.warden_name}</span>
                    </div>
                    {hostelData.warden_phone && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Phone</span>
                        <span className="text-sm font-medium">{hostelData.warden_phone}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">No warden information available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
