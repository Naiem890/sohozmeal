import { useSignIn } from "react-auth-kit";
import { toast } from "react-toastify";
import MISTImage from "../../assets/MIST.png";
import { useNavigate } from "react-router-dom";
import { Axios } from "../../api/api";

const fixedInputClass =
  "w-full rounded border-0 h-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6";

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
          role: result?.role,
          _id: result?.student?._id,
          isAuthenticated: true,
        },
      });
      toast.success("Login successful");
      if (result?.student?.firstTimeLogin) {
        navigate("/change-password");
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
        <div className="mt-6 flex items-center gap-4 justify-center">
          <img className="h-16 image" src={MISTImage} alt="Osmany Hall" />
          <div>
            <h2 className="uppercase text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Sohoz Meal (MIST)
            </h2>
            <p className="uppercase text-lg tracking-widest font-light -mt-1 text-gray-500">
              Student Portal
            </p>
          </div>
        </div>

        <div className="mt-10 ">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="studentId"
                className="block text-sm font-medium leading-6 text-gray-600"
              >
                Student ID
              </label>
              <div className="mt-2">
                <input
                  id="studentId"
                  name="studentId"
                  type="text"
                  inputMode="numeric"
                  placeholder="202014035"
                  autoComplete="studentId"
                  required
                  className={`${fixedInputClass}`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium leading-6 text-gray-600"
                >
                  Password
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="********"
                  required
                  className={`${fixedInputClass}`}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="btn bg-emerald-700 w-full rounded text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 hover:bg-emerald-600 mt-4"
              >
                Login
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-gray-500">
            Forgot password?{" "}
            <a
              href="#"
              className="font-semibold leading-6 text-emerald-600 hover:text-emerald-500"
            >
              Contact with admin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
