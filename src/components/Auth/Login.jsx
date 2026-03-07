import { useState } from "react";
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

export default function Login() {
  const signIn = useSignIn();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const studentId = e.target.studentId.value;
    const password = e.target.password.value;
    setLoading(true);
    try {
      const result = await Axios.post("/auth/login", { studentId, password }).then(
        (res) => res.data
      );
      signIn({
        token: result.token,
        expiresIn: 3600,
        tokenType: "Bearer",
        authState: {
          studentId,
          name: result?.student?.name,
          role: result?.role,
          wing: result.wing,
          _id: result?.student?._id,
          isAuthenticated: true,
        },
      });
      toast.success("Login successful");
      if (result?.student?.firstTimeLogin) {
        navigate("/change-password", { state: result.student.firstTimeLogin });
      } else {
        navigate("/dashboard/");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-md border border-border p-8 space-y-8">
        <Logo logo={MISTImage} alt="Osmany Hall" title="Sohoz Meal (MIST)" subTitle="Student Portal" />

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <Label htmlFor="studentId">Student ID</Label>
            <Input
              id="studentId"
              name="studentId"
              type="text"
              inputMode="numeric"
              placeholder="202014035"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="pr-10 tracking-widest"
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
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
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
