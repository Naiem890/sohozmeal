import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSignIn } from "react-auth-kit";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import MISTImage from "../../assets/MIST.png";
import Logo from "../Common/Logo";
import { Axios } from "../../api/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLoginSchema } from "@/schemas/auth";
import { z } from "zod";
import type { AxiosError } from "axios";

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

const REFRESH_TOKEN_DAYS = 7;

export default function AdminLogin() {
  const signIn   = useSignIn();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginForm>({ resolver: zodResolver(adminLoginSchema) });

  const onSubmit = async ({ email, password }: AdminLoginForm) => {
    try {
      const result = await Axios.post("/auth/admin/login", { email, password }).then((r) => r.data);

      localStorage.setItem("_refresh_token", result.refreshToken);

      signIn({
        token:     result.accessToken,
        expiresIn: REFRESH_TOKEN_DAYS * 24 * 60,
        tokenType: "Bearer",
        authState: {
          email,
          _id:             result._id,
          role:            "admin",
          wing:            result.wing,
          isAuthenticated: true,
        },
      });

      toast.success("Login successful");
      navigate("/admin/dashboard");
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-md border border-border p-8 space-y-8">
        <Logo logo={MISTImage} alt="Osmany Hall" title="Sohoz Meal (MIST)" subTitle="Admin Portal" />

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@mist.ac.bd"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pr-10 tracking-widest"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
