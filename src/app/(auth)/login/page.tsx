"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Suspense } from "react";
import { Loader2, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,50}$/;

const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Email or username is required")
    .refine(
      (value) =>
        value.includes("@")
          ? z.string().email().safeParse(value).success
          : USERNAME_RE.test(value),
      { message: "Enter a valid email or username" }
    ),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember_me: z.boolean().optional(),
});

const rollSchema = z.object({
  roll_number: z
    .string()
    .min(1, "Roll number is required")
    .max(20, "Roll number is too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember_me: z.boolean().optional(),
});

type EmailForm = z.infer<typeof emailSchema>;
type RollForm = z.infer<typeof rollSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loginTab, setLoginTab] = React.useState("email");

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
      password: "",
      remember_me: false,
    },
  });

  const {
    register: registerRoll,
    handleSubmit: handleSubmitRoll,
    formState: { errors: rollErrors },
    setValue: setRollValue,
    watch: watchRoll,
  } = useForm<RollForm>({
    resolver: zodResolver(rollSchema),
    defaultValues: {
      roll_number: "",
      password: "",
      remember_me: false,
    },
  });

  async function handleEmailLogin(data: EmailForm) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: data.email,
          password: data.password,
          remember_me: data.remember_me,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Login failed");
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
        variant: "success",
      });

      const redirect = searchParams.get("redirect");
      router.push(redirect || "/");
    } catch (error) {
      toast({
        title: "Login failed",
        description:
          error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRollLogin(data: RollForm) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: data.roll_number,
          password: data.password,
          login_type: "roll_number",
          remember_me: data.remember_me,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Login failed");
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
        variant: "success",
      });

      const redirect = searchParams.get("redirect");
      router.push(redirect || "/");
    } catch (error) {
      toast({
        title: "Login failed",
        description:
          error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
      <CardContent className="pt-6">
        <Tabs value={loginTab} onValueChange={setLoginTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email / Username
            </TabsTrigger>
            <TabsTrigger value="roll" className="gap-2">
              <User className="h-4 w-4" />
              Roll Number
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <form
              onSubmit={handleSubmitEmail(handleEmailLogin)}
              className="space-y-4 pt-4"
            >
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  Email or Username
                </label>
                <Input
                  id="email"
                  type="text"
                  placeholder="admin or your-email@gmail.com"
                  autoComplete="username"
                  disabled={isLoading}
                  error={emailErrors.email?.message}
                  {...registerEmail("email")}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="email-password"
                    className="text-sm font-medium"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  id="email-password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  error={emailErrors.password?.message}
                  {...registerEmail("password")}
                />
              </div>

              <Checkbox
                label="Remember me"
                disabled={isLoading}
                {...registerEmail("remember_me")}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="roll">
            <form
              onSubmit={handleSubmitRoll(handleRollLogin)}
              className="space-y-4 pt-4"
            >
              <div className="space-y-1.5">
                <label htmlFor="roll_number" className="text-sm font-medium">
                  Roll Number
                </label>
                <Input
                  id="roll_number"
                  placeholder="e.g. 23CSE001"
                  autoComplete="username"
                  disabled={isLoading}
                  error={rollErrors.roll_number?.message}
                  {...registerRoll("roll_number")}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="roll-password"
                    className="text-sm font-medium"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  id="roll-password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  error={rollErrors.password?.message}
                  {...registerRoll("password")}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="roll-remember"
                  className="h-4 w-4 rounded border shadow accent-primary"
                  disabled={isLoading}
                  onChange={(e) =>
                    setRollValue("remember_me", e.target.checked)
                  }
                  checked={watchRoll("remember_me") ?? false}
                />
                <label
                  htmlFor="roll-remember"
                  className="text-sm font-medium leading-none"
                >
                  Remember me
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-center pb-6">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Register here
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
