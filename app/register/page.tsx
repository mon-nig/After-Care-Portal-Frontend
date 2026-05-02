"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "register" | "verify-otp";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("register");

  // Registration fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [nicNo, setNicNo] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");

  // OTP step
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [showDevOtp, setShowDevOtp] = useState(false);

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
      const response = await fetch("http://localhost:8080/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, fullName, password, nicNo, district, phone, role: "FAMILY" }),
      });

      const data = await response.json().catch(() => ({ message: "Unknown error occurred" }));

      if (response.ok) {
        // OTP was auto-sent to phone — move to verification step
        setStep("verify-otp");
        setSuccessMsg("Account created! An OTP has been sent to your phone number.");
      } else {
        setError(data.message || data.error || "Failed to register. Please check your inputs.");
      }
    } catch {
      setError("An error occurred during registration. Please check your connection.");
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/v1/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, otp }),
      });

      const data = await response.json().catch(() => ({ message: "Unknown error occurred" }));

      if (response.ok) {
        setSuccessMsg("Phone verified! Redirecting to login...");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setError(data.message || "Invalid or expired OTP. Try again.");
      }
    } catch {
      setError("An error occurred. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9F8F6]">
      {/* LEFT SIDE */}
      <div className="flex w-full flex-col justify-center bg-white px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-24 z-10 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.05)] overflow-y-auto">
        <div className="mx-auto w-full max-w-sm lg:w-96">

          {/* Logo */}
          <div className="mb-10 flex flex-col items-center">
            <div className="relative h-56 w-56 rounded-full bg-white border-[6px] border-[#4a7c9f] overflow-hidden shadow-xl mb-5 flex flex-col items-center justify-end pb-6">
              <img src="/logoACP.png" alt="Aftercare Logo" className="absolute inset-0 w-full h-full object-cover" />
              <div className="relative z-10 flex flex-col items-center bg-white/80 px-6 py-1.5 rounded-2xl backdrop-blur-sm">
                <h2 className="text-2xl font-extrabold tracking-tight leading-none text-[#1e3a5f]">Aftercare</h2>
                <span className="text-xs font-bold text-[#4a7c9f] tracking-widest mt-1">PORTAL</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#4a7c9f] font-bold tracking-widest uppercase text-center">
              Digitized. Compassionate. Organized.
            </p>
          </div>

          {/* ── STEP 1: Registration form ── */}
          {step === "register" && (
            <>
              <h1 className="text-2xl font-bold text-[#1e3a5f] mb-8 text-center">Create an Account</h1>

              {error && <ErrorBanner message={error} />}

              <form onSubmit={handleRegister} className="space-y-5">
                <Field label="Username" value={username} onChange={setUsername} placeholder="Choose a username" disabled={isLoading} required />
                <Field label="Full Name" value={fullName} onChange={setFullName} placeholder="Enter your full name" disabled={isLoading} required />
                <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="Enter your email address" disabled={isLoading} required />
                <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Min 8 chars, 1 uppercase, 1 digit, 1 special" disabled={isLoading} required />
                <Field label="NIC Number" value={nicNo} onChange={setNicNo} placeholder="e.g., 200012345678" disabled={isLoading} required>
                  <p className="text-xs text-gray-500 mt-1">Your NIC must be registered in the national registry.</p>
                </Field>
                <Field label="District" value={district} onChange={setDistrict} placeholder="e.g., Kandy" disabled={isLoading} required>
                  <p className="text-xs text-gray-500 mt-1">Must match your district in the national registry.</p>
                </Field>
                <Field label="Phone Number" type="tel" value={phone} onChange={setPhone} placeholder="e.g., 0771234567" disabled={isLoading} required>
                  <p className="text-xs text-gray-500 mt-1">An OTP will be sent here to verify your account.</p>
                </Field>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-full bg-[#4a7c9f] px-4 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#3b6787] hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:-translate-y-0 transition-all duration-200 mt-2"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-600 pb-8">
                Already have an account?{" "}
                <a href="/login" className="font-bold text-[#4a7c9f] hover:text-[#3b6787] underline">Sign in here</a>
              </div>
            </>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === "verify-otp" && (
            <>
              <h1 className="text-2xl font-bold text-[#1e3a5f] mb-3 text-center">Verify Your Phone</h1>
              <p className="text-sm text-gray-500 text-center mb-6">
                A 6-digit code was sent to your registered phone number. Enter it below to activate your account.
              </p>

              {successMsg && <SuccessBanner message={successMsg} />}
              {error && <ErrorBanner message={error} />}

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
                    {devOtp ?? "Loading..."}
                  </p>
                )}
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">6-Digit OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    placeholder="123456"
                    disabled={isLoading}
                    className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#4a7c9f] disabled:opacity-50 sm:text-sm transition-all tracking-widest text-center text-lg font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-full bg-[#4a7c9f] px-4 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#3b6787] hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-70 transition-all duration-200"
                >
                  {isLoading ? "Verifying..." : "Verify Phone"}
                </button>
              </form>

              <div className="mt-4 text-center text-sm text-gray-500">
                Didn&apos;t receive the code?{" "}
                <button
                  onClick={async () => {
                    await fetch("http://localhost:8080/api/v1/auth/send-otp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ username }),
                    });
                    setShowDevOtp(false);
                    setDevOtp(null);
                    setError("");
                  }}
                  className="font-bold text-[#4a7c9f] hover:text-[#3b6787] underline"
                >
                  Resend OTP
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Image */}
      <div className="relative hidden w-full lg:flex lg:w-1/2 items-end justify-center">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/ACP-bgi2.webp')" }} />
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

// ── Shared sub-components ──────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = "text", disabled, required, children,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean; required?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#4a7c9f] disabled:opacity-50 sm:text-sm transition-all"
      />
      {children}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center gap-2">
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-xl bg-green-50 p-4 text-sm text-green-700 border border-green-200 flex items-center gap-2">
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
