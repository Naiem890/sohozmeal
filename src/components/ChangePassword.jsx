import { toast } from "react-toastify";
import { Axios } from "../api/api";
import MISTImage from "../assets/Military_Institute_of_Science_and_Technology_Monogram.svg.png";
import { useNavigate } from "react-router-dom";

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
      const result = await Axios.post(
        "/auth/change-password",
        {
          password,
        },
        { withCredentials: true }
      ).then((res) => res.data);

      console.log(result);
      toast.success(result.message);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("An error occurred while changing the password.");
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
