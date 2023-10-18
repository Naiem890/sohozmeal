import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { Axios } from "../../api/api";
import Swal from "sweetalert2";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthUser } from "react-auth-kit";
import MISTImage from "../../assets/MIST.png";
import Logo from "../Common/Logo";
import { fixedButtonClass, fixedInputClass } from "../../Utils/constant";
import { LockClosedIcon } from "@heroicons/react/24/outline";

export default function ChangePassword() {
  const auth = useAuthUser();
  const navigate = useNavigate();
  const location = useLocation();
  const firstTimeLogin = location?.state;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const oldPassword = e.target.oldPassword.value;
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmedPassword.value;

    if (password !== confirmPassword) {
      e.target.password.focus();
      toast.error("New password doesn't match");
      return;
    }

    try {
      const result = await Axios.post("/auth/change-password", {
        oldPassword,
        password,
      });

      console.log(result);
      if (result.status === 200) {
        toast.success(result.data.message);
        navigate("/dashboard");
      } else {
        toast.error(result.data.message);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error?.response?.data?.message);
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

        {firstTimeLogin && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-gray-800">
              Welcome, <br /> {auth().name}!
            </h2>
            <div className="mt-2 -mb-5 text-blue-500 text-sm">
              Password change is required. Change it now! Unless you want your
              friend to play with your meals. 😄🍔
            </div>
          </div>
        )}

        <div className="mt-10">
          <form className="flex flex-col gap-4" onSubmit={handlePasswordChange}>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-600"
              >
                Old Password
              </label>
              <input
                id="oldPassword"
                name="oldPassword"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                className={`${fixedInputClass} mt-2 tracking-widest`}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-600"
              >
                New Password
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
            <div>
              <label
                htmlFor="confirmedPassword"
                className="block text-sm font-medium leading-6 text-gray-600"
              >
                Confirm Password
              </label>
              <input
                id="confirmedPassword"
                name="confirmedPassword"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                className={`${fixedInputClass} mt-2 tracking-widest`}
              />
            </div>

            <button type="submit" className={`${fixedButtonClass} mt-4`}>
              <LockClosedIcon className="h-5 w-5" />
              Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
