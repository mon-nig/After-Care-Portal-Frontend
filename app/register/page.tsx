"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [nicNo, setNicNo] = useState("");
  const [role, setRole] = useState("FAMILY");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const payload: Record<string, string> = { username, email, fullName, password, role };
      if (role === "FAMILY" && nicNo) {
        payload.nicNo = nicNo;
      }

      const response = await fetch("http://localhost:8080/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({ message: "Unknown error occurred" }));

      if (response.ok) {
        setSuccessMsg("Registration successful! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.message || data.error || "Failed to register. Please check your inputs.");
      }
    } catch (err) {
      setError("An error occurred during registration. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9F8F6]">
      {/* LEFT SIDE: The Register Form */}
      <div className="flex w-full flex-col justify-center bg-white px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-24 z-10 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.05)] overflow-y-auto">
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
            Create an Account
          </h1>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 rounded-xl bg-green-50 p-4 text-sm text-green-700 border border-green-200 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#4a7c9f] disabled:opacity-50 sm:text-sm transition-all"
                placeholder="Choose a username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#4a7c9f] disabled:opacity-50 sm:text-sm transition-all"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#4a7c9f] disabled:opacity-50 sm:text-sm transition-all"
                placeholder="Enter your email address"
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
                className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#4a7c9f] disabled:opacity-50 sm:text-sm transition-all"
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isLoading}
                className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#4a7c9f] disabled:opacity-50 sm:text-sm transition-all"
              >
                <option value="FAMILY">Family Member</option>
                <option value="GRAMA_NILADHARI">Grama Niladhari</option>
                <option value="REGISTRAR">Registrar</option>
              </select>
            </div>

            {/* NIC field shown only for FAMILY role */}
            {role === "FAMILY" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">NIC Number</label>
                <input
                  type="text"
                  value={nicNo}
                  onChange={(e) => setNicNo(e.target.value)}
                  disabled={isLoading}
                  className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#4a7c9f] disabled:opacity-50 sm:text-sm transition-all"
                  placeholder="e.g., 200012345678"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Your NIC is used to link death certificates and track form submissions.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || successMsg !== ""}
              className="flex w-full justify-center rounded-full bg-[#4a7c9f] px-4 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#3b6787] hover:shadow-lg transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a7c9f] disabled:opacity-70 disabled:hover:-translate-y-0 disabled:hover:shadow-md transition-all duration-200 mt-2"
            >
              {isLoading ? "Registering..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 pb-8">
            Already have an account?{" "}
            <a href="/login" className="font-bold text-[#4a7c9f] hover:text-[#3b6787] underline">
              Sign in here
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
