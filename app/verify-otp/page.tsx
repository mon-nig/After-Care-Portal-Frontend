"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [username, setUsername] = useState(searchParams.get("username") || "");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [showDevOtp, setShowDevOtp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleShowDevOtp = async () => {
    setShowDevOtp(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/auth/dev/otp/${username}`);
      const data = await res.json();
      setDevOtp(data.otp || null);
    } catch {
      setDevOtp(null);
    }
  };

  const handleResend = async () => {
    setError("");
    setShowDevOtp(false);
    setDevOtp(null);
    await fetch("http://localhost:8080/api/v1/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, otp }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("Phone verified! Redirecting to login...");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setError(data.message || "Invalid or expired OTP.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9F8F6] items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Verify Your Phone</h1>
          <p className="text-sm text-gray-500 mt-2">
            Your account is registered but not yet verified. Enter the 6-digit code sent to your phone.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 rounded-xl bg-green-50 p-4 text-sm text-green-700 border border-green-200">
            {success}
          </div>
        )}

        {/* Dev mode OTP reveal */}
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-700 mb-2">🛠 Development Mode — SMS not yet wired</p>
          {!showDevOtp ? (
            <button
              onClick={handleShowDevOtp}
              className="text-xs font-bold text-amber-800 underline hover:text-amber-900"
            >
              Show OTP from server
            </button>
          ) : (
            <p className="text-sm font-mono font-bold text-amber-900 tracking-widest">
              {devOtp ?? "No pending OTP — try resending below"}
            </p>
          )}
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#4a7c9f] sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">6-Digit OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              placeholder="123456"
              disabled={isLoading}
              required
              className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#4a7c9f] sm:text-sm tracking-widest text-center text-lg font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-full bg-[#4a7c9f] px-4 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#3b6787] disabled:opacity-70 transition-all duration-200"
          >
            {isLoading ? "Verifying..." : "Verify Phone"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Didn&apos;t receive the code?{" "}
          <button
            onClick={handleResend}
            className="font-bold text-[#4a7c9f] hover:text-[#3b6787] underline"
          >
            Resend OTP
          </button>
        </div>

        <div className="mt-3 text-center">
          <a href="/login" className="text-sm text-gray-400 hover:text-gray-600 underline">
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpContent />
    </Suspense>
  );
}
