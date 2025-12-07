"use client";

import { signIn, useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect ke home jika sudah login
  useEffect(() => {
    if (status === "authenticated") {
      redirect("/home");
    }
  }, [status]);

  async function handleLogin(formData) {
    const response = await signIn("credentials", {
      redirect: false,
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!response?.ok) {
      alert("Login Failed");
      return;
    }

    // Redirect setelah login berhasil
    redirect("/home");
  }

  // Tampilkan loading saat mengecek session
  if (status === "loading") {
    return (
      <div className="h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Hanya tampilkan form jika belum login
  if (status === "unauthenticated") {
   return (
  <div className="h-screen flex justify-center items-center bg-white">
    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-md mx-4 border border-gray-200">
      <div className="p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              ></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600">
            Sign in to your account
          </p>
        </div>

        <form action={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-200"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember-me"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-gray-700"
            >
              Remember me
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sign In
          </button>
        </form>
      </div>

      <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
        <p className="text-center text-sm text-gray-500">
          By signing in, you agree to our Terms and Privacy Policy
        </p>
      </div>
    </div>
  </div>
);
  }

  return null;
}
