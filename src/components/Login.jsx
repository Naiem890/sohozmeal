import MISTImage from "../assets/Military_Institute_of_Science_and_Technology_Monogram.svg.png";
export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center -mt-16">
      <form className="w-80 flex flex-col gap-6">
        <img
          src={MISTImage}
          alt=""
          width="200px"
          className="block mx-auto mb-4"
        />
        <div className="form-control">
          <input
            type="text"
            className="input input-sm input-ghost outline-none placeholder:uppercase focus:outline-none text-lg border-0 border-b-2 border-green-600"
            placeholder="Student Id"
          />
        </div>
        <div className="form-control">
          <input
            type="password"
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
