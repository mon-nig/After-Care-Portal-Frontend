"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/auth-context";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { setCurrentRole, setCurrentUserId, setCurrentNicNo, setCurrentUsername } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const role = data.roles && data.roles.length > 0 ? data.roles[0] : "GUEST";
        setCurrentRole(role);
        setCurrentUserId(data.userId);
        setCurrentNicNo(data.nicNo || null);
        setCurrentUsername(data.username || null);
        router.push("/");
      } else {
        setError(data.message || "Invalid username or password");
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9F8F6]">
      {/* LEFT SIDE: The Login Form */}
      <div className="flex w-full flex-col justify-center bg-white px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-24 z-10 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="mx-auto w-full max-w-sm lg:w-96">

          {/* Logo / Branding Header */}
          <div className="mb-10 flex flex-col items-center">
            <div className="relative h-56 w-56 rounded-full bg-white border-[6px] border-[#4a7c9f] overflow-hidden shadow-xl mb-5 flex flex-col items-center justify-end pb-6">
              <img
                src="/logoACP.png"
                alt="Aftercare Logo"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="relative z-10 flex flex-col items-center bg-white/80 px-6 py-1.5 rounded-2xl backdrop-blur-sm">
                <h2 className="text-2xl font-extrabold tracking-tight leading-none text-[#1e3a5f]">
                  Aftercare
                </h2>
                <span className="text-xs font-bold text-[#4a7c9f] tracking-widest mt-1">
                  PORTAL
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#4a7c9f] font-bold tracking-widest uppercase text-center">
              Digitized. Compassionate. Organized.
            </p>
          </div>

          <h1 className="text-2xl font-bold text-[#1e3a5f] mb-8 text-center">
            Welcome
          </h1>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="block w-full rounded-xl border-0 py-3.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#4a7c9f] disabled:opacity-50 sm:text-sm sm:leading-6 transition-all"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="block w-full rounded-xl border-0 py-3.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#4a7c9f] disabled:opacity-50 sm:text-sm sm:leading-6 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-full bg-[#4a7c9f] px-4 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#3b6787] hover:shadow-lg transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a7c9f] disabled:opacity-70 disabled:hover:-translate-y-0 disabled:hover:shadow-md transition-all duration-200"
            >
              {isLoading ? "Securely Logging In..." : "Secure Login"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <a href="/register" className="font-bold text-[#4a7c9f] hover:text-[#3b6787] underline">
              Register here
            </a>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Image Area */}
      <div className="relative hidden w-full lg:flex lg:w-1/2 items-end justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/ACP-bgi2.webp')" }}
        />
        <div className="absolute inset-0 bg-[#1e3a5f]/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e3a5f] via-[#1e3a5f]/60 to-transparent" />
        <div className="relative z-10 max-w-xl px-12 pb-24 text-left">
          <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight">
            Navigating Aftercare with Compassion and Clarity.
          </h2>
          <p className="text-lg text-blue-100 font-medium leading-relaxed">
            We exist to provide clarity and ease the administrative burden after the loss of a loved one. A secure, digital ecosystem bridging families and officials.
          </p>
        </div>
      </div>
    </div>
  );
}