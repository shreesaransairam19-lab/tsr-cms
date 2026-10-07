"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, ShieldCheck, User as UserIcon, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, fullName, role, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Unable to load your profile.</p>
      </div>
    );
  }

  const name = fullName || user.email?.split("@")[0] || "User";
  const email = user.email || "—";
  const roleDisplay = (role || "student").replace(/_/g, " ");

  const infoRows = [
    { label: "Full Name", value: name, icon: UserIcon },
    { label: "Email", value: email, icon: Mail },
    { label: "Role", value: roleDisplay, icon: ShieldCheck },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">View your account details</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar
              fallback={name}
              size="xl"
              className="h-20 w-20 border-4 border-border shadow-md"
            />
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-tight">{name}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
              <Badge variant="secondary" className="w-fit capitalize">
                {roleDisplay}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Account</CardTitle>
          <CardDescription>Basic information about your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {infoRows.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className={cn("truncate text-sm font-medium capitalize", label === "Email" && "normal-case")}>
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">
            To update any of these details, please contact the system administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
