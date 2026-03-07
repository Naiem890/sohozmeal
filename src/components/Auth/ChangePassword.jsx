import { useState } from "react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthUser } from "react-auth-kit";
import { Eye, EyeOff, Lock } from "lucide-react";
import MISTImage from "../../assets/MIST.png";
import Logo from "../Common/Logo";
import { Axios } from "../../api/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function PasswordField({ id, name, label, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          placeholder="••••••••"
          autoComplete={autoComplete}
          required
          className="pr-10 tracking-widest"
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
    </div>
  );
}

export default function ChangePassword() {
  const auth = useAuthUser();
  const navigate = useNavigate();
  const location = useLocation();
  const firstTimeLogin = location?.state;
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const oldPassword = e.target.oldPassword.value;
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmedPassword.value;

    if (password !== confirmPassword) {
      e.target.password.focus();
      toast.error("New passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const result = await Axios.post("/auth/change-password", { oldPassword, password });
      if (result.status === 200) {
        toast.success(result.data.message);
        navigate("/dashboard");
      } else {
        toast.error(result.data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-md border border-border p-8 space-y-8">
        <Logo logo={MISTImage} alt="Osmany Hall" title="Sohoz Meal (MIST)" subTitle="Student Portal" />

        {firstTimeLogin && (
          <div className="rounded-lg bg-accent border border-accent-foreground/10 px-4 py-3">
            <p className="text-sm font-semibold text-accent-foreground">
              Welcome, {auth().name}!
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Please change your password before continuing.
            </p>
          </div>
        )}

        <form className="space-y-5" onSubmit={handlePasswordChange}>
          <PasswordField
            id="oldPassword"
            name="oldPassword"
            label="Current Password"
            autoComplete="current-password"
          />
          <PasswordField
            id="password"
            name="password"
            label="New Password"
            autoComplete="new-password"
          />
          <PasswordField
            id="confirmedPassword"
            name="confirmedPassword"
            label="Confirm New Password"
            autoComplete="new-password"
          />

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <Lock className="h-4 w-4" />
            {loading ? "Changing…" : "Change Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
