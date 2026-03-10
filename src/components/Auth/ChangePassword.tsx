import { useState } from "react";
import { useForm, type UseFormRegisterReturn, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthUser } from "react-auth-kit";
import { Eye, EyeOff, Lock } from "lucide-react";
import type { AxiosError } from "axios";
import MISTImage from "../../assets/MIST.png";
import Logo from "../Common/Logo";
import { Axios } from "../../api/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordSchema } from "@/schemas/auth";

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

interface PasswordFieldProps {
  id: string;
  label: string;
  autoComplete: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
}

function PasswordField({ id, label, autoComplete, registration, error }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder="••••••••"
          autoComplete={autoComplete}
          className="pr-10 tracking-widest"
          {...registration}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}

export default function ChangePassword() {
  const auth = useAuthUser();
  const navigate = useNavigate();
  const location = useLocation();
  const firstTimeLogin = location?.state;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async ({ oldPassword, password }: ChangePasswordForm) => {
    try {
      const result = await Axios.post<{ message: string }>("/auth/change-password", {
        oldPassword,
        password,
      });
      if (result.status === 200) {
        toast.success(result.data.message);
        navigate("/dashboard");
      } else {
        toast.error(result.data.message);
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error?.response?.data?.message || "Failed to change password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-md border border-border p-8 space-y-8">
        <Logo logo={MISTImage} alt="Osmany Hall" title="Sohoz Meal (MIST)" subTitle="Student Portal" />

        {firstTimeLogin && (
          <div className="rounded-lg bg-accent border border-accent-foreground/10 px-4 py-3">
            <p className="text-sm font-semibold text-accent-foreground">
              Welcome, {(auth() as { name?: string })?.name}!
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Please change your password before continuing.
            </p>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <PasswordField
            id="oldPassword"
            label="Current Password"
            autoComplete="current-password"
            registration={register("oldPassword")}
            error={errors.oldPassword}
          />
          <PasswordField
            id="password"
            label="New Password"
            autoComplete="new-password"
            registration={register("password")}
            error={errors.password}
          />
          <PasswordField
            id="confirmedPassword"
            label="Confirm New Password"
            autoComplete="new-password"
            registration={register("confirmedPassword")}
            error={errors.confirmedPassword}
          />

          <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
            <Lock className="h-4 w-4" />
            {isSubmitting ? "Changing…" : "Change Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
