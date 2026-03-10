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
import { studentLoginSchema } from "@/schemas/auth";
import { z } from "zod";
import type { AxiosError } from "axios";

type StudentLoginForm = z.infer<typeof studentLoginSchema>;

const REFRESH_TOKEN_DAYS = 7;

export default function Login() {
  const signIn   = useSignIn();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentLoginForm>({ resolver: zodResolver(studentLoginSchema) });

  const onSubmit = async ({ studentId, password }: StudentLoginForm) => {
    try {
      const result = await Axios.post("/auth/login", { studentId, password }).then((r) => r.data);

      localStorage.setItem("_refresh_token", result.refreshToken);

      signIn({
        token:     result.accessToken,
        expiresIn: REFRESH_TOKEN_DAYS * 24 * 60, // keep auth-kit state alive for 7 days
        tokenType: "Bearer",
        authState: {
          studentId,
          name:            result?.student?.name,
          role:            "student",
          wing:            result.wing,
          _id:             result?.student?._id,
          isAuthenticated: true,
        },
      });

      toast.success("Login successful");
      if (result?.student?.firstTimeLogin) {
        navigate("/change-password", { state: result.student.firstTimeLogin });
      } else {
        navigate("/dashboard/");
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-md border border-border p-8 space-y-8">
        <Logo logo={MISTImage} alt="Osmany Hall" title="Sohoz Meal (MIST)" subTitle="Student Portal" />

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="studentId">Student ID</Label>
            <Input
              id="studentId"
              type="text"
              inputMode="numeric"
              placeholder="202014035"
              autoComplete="username"
              {...register("studentId")}
            />
            {errors.studentId && (
              <p className="text-sm text-destructive">{errors.studentId.message}</p>
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

        <p className="text-center text-sm text-muted-foreground">
          Forgot password?{" "}
          <a href="#" className="font-medium text-primary hover:underline">
            Contact Hall Office
          </a>
        </p>
      </div>
    </div>
  );
}
