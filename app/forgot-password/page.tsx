"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "request" | "reset";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [showDevOtp, setShowDevOtp] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("reset");
        setSuccess(data.message || "OTP sent to your registered phone number.");
      } else {
        setError(data.message || "Could not send OTP. Check your username.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, otp, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setError(data.message || "Failed to reset password.");
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
          <h1 className="text-2xl font-bold text-[#1e3a5f]">
            {step === "request" ? "Forgot Password" : "Reset Password"}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {step === "request"
              ? "Enter your username and we'll send an OTP to your registered phone."
              : "Enter the OTP sent to your phone and choose a new password."}
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

        {step === "request" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#4a7c9f] sm:text-sm"
                placeholder="Enter your username"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-full bg-[#4a7c9f] px-4 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#3b6787] disabled:opacity-70 transition-all duration-200"
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === "reset" && (
          <>
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
                  {devOtp ?? "No pending OTP — try resending"}
                </p>
              )}
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  placeholder="123456"
                  required
                  disabled={isLoading}
                  className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#4a7c9f] sm:text-sm tracking-widest text-center text-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Min 8 chars, 1 uppercase, 1 digit, 1 special"
                  className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#4a7c9f] sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Re-enter new password"
                  className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#4a7c9f] sm:text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-full bg-[#4a7c9f] px-4 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#3b6787] disabled:opacity-70 transition-all duration-200"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-500">
              Didn&apos;t receive the code?{" "}
              <button
                onClick={async () => {
                  setShowDevOtp(false);
                  setDevOtp(null);
                  await fetch("http://localhost:8080/api/v1/auth/forgot-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username }),
                  });
                }}
                className="font-bold text-[#4a7c9f] hover:text-[#3b6787] underline"
              >
                Resend OTP
              </button>
            </div>
          </>
        )}

        <div className="mt-4 text-center">
          <a href="/login" className="text-sm text-gray-400 hover:text-gray-600 underline">
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
