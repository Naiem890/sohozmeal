import { useSignIn } from "react-auth-kit";
import { toast } from "react-toastify";
import MISTImage from "../../assets/MIST.png";
import { useNavigate } from "react-router-dom";
import { Axios } from "../../api/api";
import Logo from "../Common/Logo";
import { fixedButtonClass, fixedInputClass } from "../../Utils/constant";

export default function Login() {
  const signIn = useSignIn();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const studentId = e.target.studentId.value;
    const password = e.target.password.value;

    try {
      const result = await Axios.post("/auth/login", {
        studentId,
        password,
      }).then((res) => res.data);

      console.log(result);
      signIn({
        token: result.token,
        expiresIn: 3600,
        tokenType: "Bearer",
        authState: {
          studentId: studentId,
          name: result?.student?.name,
          role: result?.role,
          _id: result?.student?._id,
          isAuthenticated: true,
        },
      });
      toast.success("Login successful");
      if (result?.student?.firstTimeLogin) {
        navigate("/change-password", {
          state: result.student.firstTimeLogin,
        });
      } else {
        navigate("/dashboard/");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f6f6] flex-1 flex-col justify-center px-4 py-12 lg:px-8 -mt-16 md:my-0">
      <div className="shadow-lg bg-white rounded-xl p-6 sm:p-10 sm:mx-auto sm:w-full sm:max-w-md">
        <Logo
          logo={MISTImage}
          alt="Osmany Hall"
          title="Sohoz Meal (MIST)"
          subTitle="Student Portal"
        />

        <div className="mt-10 ">
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="studentId"
                className="block text-sm font-medium leading-6 text-gray-600"
              >
                Student ID
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                inputMode="numeric"
                placeholder="202014035"
                autoComplete="studentId"
                required
                className={`${fixedInputClass} mt-2`}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-600"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                className={`${fixedInputClass} mt-2 tracking-widest`}
              />
            </div>

            <button type="submit" className={`${fixedButtonClass} mt-4`}>
              Login
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-gray-500">
            Forgot password?{" "}
            <a
              href="#"
              className="font-semibold leading-6 text-emerald-600 hover:text-emerald-500"
            >
              Contact Hall Office
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
