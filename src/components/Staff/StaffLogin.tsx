import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSignIn } from "react-auth-kit";
import { toast } from "sonner";
import MISTImage from "../../assets/MIST.png";
import { useNavigate } from "react-router-dom";
import { Axios } from "../../api/api";
import Logo from "../Common/Logo";
import { staffLoginSchema } from "@/schemas/auth";
import { z } from "zod";
import type { AxiosError } from "axios";

type StaffLoginForm = z.infer<typeof staffLoginSchema>;

const REFRESH_TOKEN_DAYS = 7;

const fixedInputClass  = "w-full rounded-lg h-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6";
const fixedButtonClass = "w-full rounded-lg bg-emerald-700 text-white hover:bg-emerald-600 px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-colors";

export default function StaffLogin() {
  const signIn   = useSignIn();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StaffLoginForm>({ resolver: zodResolver(staffLoginSchema) });

  const onSubmit = async ({ staffId, password }: StaffLoginForm) => {
    try {
      const result = await Axios.post("/auth/staff/login", { staffId, password }).then((r) => r.data);

      localStorage.setItem("_refresh_token", result.refreshToken);

      signIn({
        token:     result.accessToken,
        expiresIn: REFRESH_TOKEN_DAYS * 24 * 60,
        tokenType: "Bearer",
        authState: {
          staffId,
          role:            result.role,
          isAuthenticated: true,
        },
      });

      toast.success("Login successful");
      navigate("/staff/dashboard");
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      toast.error(error?.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f6f6] flex-1 flex-col justify-center px-4 py-12 lg:px-8 -mt-16 md:my-0">
      <div className="shadow-lg bg-white rounded-xl p-6 sm:p-10 sm:mx-auto sm:w-full sm:max-w-md">
        <Logo logo={MISTImage} alt="Osmany Hall" title="Sohoz Meal (MIST)" subTitle="Staff Portal" />

        <div className="mt-10">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="staffId" className="block text-sm font-medium leading-6 text-gray-600">
                Staff ID
              </label>
              <input
                id="staffId"
                type="text"
                autoComplete="username"
                placeholder="Staff ID"
                className={`${fixedInputClass} mt-2`}
                {...register("staffId")}
              />
              {errors.staffId && (
                <p className="mt-1 text-sm text-red-600">{errors.staffId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-600">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={`${fixedInputClass} mt-2 tracking-widest`}
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className={`${fixedButtonClass} mt-4`}>
              {isSubmitting ? "Logging in…" : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
