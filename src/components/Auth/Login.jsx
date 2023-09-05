import { useSignIn } from "react-auth-kit";
import { toast } from "react-toastify";
import MISTImage from "../../assets/MIST.png";
import { useNavigate } from "react-router-dom";
import { Axios } from "../../api/api";

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
    <div className="min-h-screen flex items-center justify-center -mt-16">
      <form onSubmit={handleLogin} className="w-80 flex flex-col gap-6">
        <img
          src={MISTImage}
          alt=""
          width="200px"
          className="block mx-auto mb-4"
        />
        <div className="form-control">
          <input
            type="text"
            name="studentId"
            className="input input-sm input-ghost outline-none placeholder:uppercase focus:outline-none text-lg border-0 border-b-2 border-green-600"
            placeholder="Student Id"
          />
        </div>
        <div className="form-control">
          <input
            type="password"
            name="password"
            className="input input-sm input-ghost placeholder:uppercase outline-none focus:outline-none text-lg border-0 border-b-2 border-green-600"
            placeholder="Password"
          />
        </div>
        <button type="submit" className="btn btn-success hover:btn-primary">
          Login
        </button>
      </form>
    </div>
  );
}
