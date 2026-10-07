"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  ClipboardCheck,
  FileText,
  IndianRupee,
  BookOpen,
  Home,
  Bus,
  Bell,
  BarChart3,
  Settings,
  Wallet,
  UserCircle,
  BookMarked,
  FileCheck,
  ChevronDown,
  Menu,
  X,
  LogOut,
  GraduationCapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

type UserRole = "admin" | "faculty" | "student";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notificationCount?: number;
}

const adminNavGroups: NavGroup[] = [
  {
    title: "Main",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "Management",
    items: [
      { title: "Students", href: "/students", icon: GraduationCap },
      { title: "Faculty", href: "/faculty", icon: Users },
      { title: "Subjects", href: "/subjects", icon: BookOpen },
      { title: "Attendance & Timetable", href: "/timetable", icon: Calendar },
      { title: "Exams", href: "/exams", icon: FileText },
      { title: "Fees", href: "/fees", icon: IndianRupee },
      { title: "Library", href: "/library", icon: BookOpen },
      { title: "Hostel", href: "/hostel", icon: Home },
      { title: "Transport", href: "/transport", icon: Bus },
    ],
  },
  {
    title: "System",
    items: [
      { title: "Notifications", href: "/notifications", icon: Bell },
      { title: "Reports", href: "/reports", icon: BarChart3 },
      { title: "Settings", href: "/settings", icon: Settings },
      { title: "Payroll", href: "/payroll", icon: Wallet },
    ],
  },
];

const facultyNavGroups: NavGroup[] = [
  {
    title: "Main",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "Teaching",
    items: [
      { title: "Classes & Attendance", href: "/timetable", icon: Calendar },
      { title: "Mark Attendance", href: "/attendance/mark", icon: ClipboardCheck },
      { title: "Exams", href: "/exams", icon: FileText },
    ],
  },
  {
    title: "Other",
    items: [
      { title: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
];

const studentNavGroups: NavGroup[] = [
  {
    title: "Main",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "Academic",
    items: [
      { title: "My Profile", href: "/student/profile", icon: UserCircle },
      { title: "Attendance", href: "/attendance", icon: ClipboardCheck },
      { title: "Results", href: "/exams/results", icon: FileCheck },
      { title: "Fees", href: "/student/fees", icon: IndianRupee },
    ],
  },
  {
    title: "Facilities",
    items: [
      { title: "Library", href: "/library", icon: BookOpen },
      { title: "Hostel", href: "/student/hostel", icon: Home },
      { title: "Transport", href: "/student/transport", icon: Bus },
      { title: "Notifications", href: "/notifications", icon: Bell },
      { title: "Documents", href: "/documents", icon: FileText },
    ],
  },
];

function getNavGroups(role: UserRole): NavGroup[] {
  switch (role) {
    case "admin":
      return adminNavGroups;
    case "faculty":
      return facultyNavGroups;
    case "student":
      return studentNavGroups;
    default:
      return adminNavGroups;
  }
}

function SidebarContent({
  user,
  notificationCount,
  onLinkClick,
}: {
  user: SidebarProps["user"];
  notificationCount?: number;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});
  const navGroups = getNavGroups(user.role);

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [title]: prev[title] === false ? true : false,
    }));
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white overflow-hidden">
          <img src="/logo.svg" alt="TSR" className="h-8 w-8 object-contain" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">TSR</span>
          <span className="text-[10px] text-muted-foreground">College Management</span>
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-2" maxHeight="calc(100vh - 220px)">
        <nav className="space-y-1">
          {navGroups.map((group) => {
            const isExpanded = expandedGroups[group.title] !== false;

            return (
              <div key={group.title} className="mb-2">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {group.title}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="mt-0.5 space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onLinkClick}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{item.title}</span>
                          {item.title === "Notifications" && notificationCount != null && notificationCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-medium text-destructive-foreground">
                              {notificationCount > 99 ? "99+" : notificationCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar src={user.avatar} fallback={user.name} size="sm" />
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
          <a
            href="/api/auth/logout"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ user, open, onOpenChange, notificationCount }: SidebarProps) {
  return (
    <>
      <aside className="hidden h-screen w-64 border-r bg-sidebar text-sidebar-foreground lg:block">
        <SidebarContent
          user={user}
          notificationCount={notificationCount}
        />
      </aside>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent
            user={user}
            notificationCount={notificationCount}
            onLinkClick={() => onOpenChange(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

export { Sidebar, type SidebarProps, type UserRole };
