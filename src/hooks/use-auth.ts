"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

interface AuthState {
  user: UserProfile | null;
  fullName: string;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    fullName: "",
    isLoading: true,
    isAuthenticated: false,
  });
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  React.useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          setState({
            user: null,
            fullName: "",
            isLoading: false,
            isAuthenticated: false,
          });
          return;
        }

        const { data: profile } = await supabase
          .from("users")
          .select("role, is_active")
          .eq("id", authUser.id)
          .single();

        let fullName = authUser.email?.split("@")[0] || "User";

        const firstName =
          authUser.user_metadata?.first_name ||
          authUser.user_metadata?.full_name;

        if (firstName) {
          fullName = firstName;
        }

        setState({
          user: {
            id: authUser.id,
            email: authUser.email || "",
            role: (profile?.role as UserRole) || "student",
            is_active: profile?.is_active ?? true,
          },
          fullName,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch {
        setState({
          user: null,
          fullName: "",
          isLoading: false,
          isAuthenticated: false,
        });
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setState({
          user: null,
          fullName: "",
          isLoading: false,
          isAuthenticated: false,
        });
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role, is_active")
        .eq("id", session.user.id)
        .single();

      let fullName = session.user.email?.split("@")[0] || "User";
      const firstName =
        session.user.user_metadata?.first_name ||
        session.user.user_metadata?.full_name;

      if (firstName) {
        fullName = firstName;
      }

      setState({
        user: {
          id: session.user.id,
          email: session.user.email || "",
          role: (profile?.role as UserRole) || "student",
          is_active: profile?.is_active ?? true,
        },
        fullName,
        isLoading: false,
        isAuthenticated: true,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.refresh();
    },
    [supabase, router]
  );

  const logout = React.useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [supabase, router]);

  return {
    user: state.user,
    fullName: state.fullName,
    role: state.user?.role || null,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    login,
    logout,
  };
}
