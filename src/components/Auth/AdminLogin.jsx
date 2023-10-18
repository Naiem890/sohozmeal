import { useSignIn } from "react-auth-kit";
import { toast } from "react-hot-toast";
import MISTImage from "../../assets/MIST.png";
import { useNavigate } from "react-router-dom";
import { Axios } from "../../api/api";
import Logo from "../Common/Logo";
import { fixedButtonClass, fixedInputClass } from "../../Utils/constant";

export default function AdminLogin() {
  const signIn = useSignIn();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const result = await Axios.post("/auth/admin/login", {
        email,
        password,
      }).then((res) => res.data);

      signIn({
        token: result.token,
        expiresIn: 3600,
        tokenType: "Bearer",
        authState: {
          email: email,
          _id: result._id,
          role: "admin",
          isAuthenticated: true,
        },
      });
      toast.success("Login successful");

      navigate("/admin/dashboard");
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
          subTitle="Admin Portal"
        />

        <div className="mt-10 ">
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-gray-600"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="email"
                placeholder="Email"
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
        </div>
      </div>
    </div>
  );
}
