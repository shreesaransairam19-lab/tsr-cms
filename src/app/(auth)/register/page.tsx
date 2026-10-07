"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const registerSchema = z
  .object({
    first_name: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name is too long"),
    last_name: z
      .string()
      .min(1, "Last name (initial) is required")
      .max(5, "Initial should be 1-2 characters"),
    email: z
      .string()
      .email("Please enter a valid email address"),
    roll_number: z
      .string()
      .regex(
        /^\d{6}[A-Z]{2,4}R\d{3}$/,
        "Format: YY#####DEPT RNNN (e.g. 240001ITR068)"
      ),
    phone: z
      .string()
      .regex(/^\d{10}$/, "Phone number must be exactly 10 digits")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      roll_number: "",
      phone: "",
      password: "",
      confirm_password: "",
    },
  });

  async function onSubmit(data: RegisterForm) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          roll_number: data.roll_number,
          phone: data.phone || undefined,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      setIsSuccess(true);
      toast({
        title: "Registration successful",
        description:
          "Your account has been created. Please check your email for verification.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Registration failed",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-500" />
          <h2 className="mb-2 text-xl font-semibold">Registration Complete</h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Your account has been created successfully. Please check your
            email for verification instructions, then sign in.
          </p>
          <Button asChild>
            <Link href="/login">Go to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="first_name" className="text-sm font-medium">
                First Name
              </label>
              <Input
                id="first_name"
                placeholder="John"
                disabled={isLoading}
                error={errors.first_name?.message}
                {...register("first_name")}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="last_name" className="text-sm font-medium">
                Last Name (Initial)
              </label>
              <Input
                id="last_name"
                  placeholder="K"
                disabled={isLoading}
                error={errors.last_name?.message}
                {...register("last_name")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              College Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="your-email@gmail.com"
              autoComplete="email"
              disabled={isLoading}
              error={errors.email?.message}
              {...register("email")}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="roll_number" className="text-sm font-medium">
              Roll Number
            </label>
            <Input
              id="roll_number"
              placeholder="240001ITR001"
              autoComplete="off"
              disabled={isLoading}
              error={errors.roll_number?.message}
              {...register("roll_number")}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone Number (Optional)
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="9876543210"
              autoComplete="tel"
              disabled={isLoading}
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-password" className="text-sm font-medium">
              Password
            </label>
            <PasswordInput
              id="reg-password"
              placeholder="Min 8 chars, upper, lower, number"
              autoComplete="new-password"
              disabled={isLoading}
              error={errors.password?.message}
              {...register("password")}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm_password" className="text-sm font-medium">
              Confirm Password
            </label>
            <PasswordInput
              id="confirm_password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              disabled={isLoading}
              error={errors.confirm_password?.message}
              {...register("confirm_password")}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center pb-6">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
