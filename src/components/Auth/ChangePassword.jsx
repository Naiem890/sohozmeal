import { toast } from "react-toastify";
import MISTImage from "../../assets/MIST.png";
import { useNavigate } from "react-router-dom";
import { Axios } from "../../api/api";

export default function ChangePassword() {
  const navigate = useNavigate();
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmedPassword.value;

    if (password !== confirmPassword) {
      alert("Password does not match");
      return;
    }

    try {
      const result = await Axios.post("/auth/change-password", {
        password,
      }).then((res) => res.data);

      console.log(result);
      toast.success(result.message);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error?.response?.data?.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center -mt-16">
      <form
        onSubmit={handlePasswordChange}
        className="w-80 flex flex-col gap-6"
      >
        <img
          src={MISTImage}
          alt=""
          width="200px"
          className="block mx-auto mb-4"
        />
        <div className="form-control">
          <input
            type="password"
            name="password"
            className="input input-sm input-ghost placeholder:uppercase outline-none focus:outline-none text-lg border-0 border-b-2 border-green-600"
            placeholder="Password"
          />
        </div>
        <div className="form-control">
          <input
            type="password"
            name="confirmedPassword"
            className="input input-sm input-ghost placeholder:uppercase outline-none focus:outline-none text-lg border-0 border-b-2 border-green-600"
            placeholder="Re-enter Password"
          />
        </div>
        <button type="submit" className="btn btn-success hover:btn-primary">
          Confirm Password
        </button>
      </form>
    </div>
  );
}
