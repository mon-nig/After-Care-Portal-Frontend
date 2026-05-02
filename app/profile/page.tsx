"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/auth-context";

export default function ProfilePage() {
  const { currentUsername, token, currentRole } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Phone change form
  const [oldPhone, setOldPhone] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [phoneMsg, setPhoneMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Email change form
  const [oldEmail, setOldEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (currentRole === "GUEST") router.push("/login");
  }, [currentRole, router]);

  if (!isMounted || currentRole === "GUEST") return null;

  const authHeader = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const handleChangePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneMsg(null);
    setPhoneLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/v1/profile/phone", {
        method: "PATCH",
        headers: authHeader,
        body: JSON.stringify({ oldPhone, newPhone, password: phonePassword }),
      });
      const data = await res.json();
      setPhoneMsg({ text: data.message, ok: res.ok });
      if (res.ok) { setOldPhone(""); setNewPhone(""); setPhonePassword(""); }
    } catch {
      setPhoneMsg({ text: "An error occurred. Please try again.", ok: false });
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    setEmailLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/v1/profile/email", {
        method: "PATCH",
        headers: authHeader,
        body: JSON.stringify({ oldEmail, newEmail, password: emailPassword }),
      });
      const data = await res.json();
      setEmailMsg({ text: data.message, ok: res.ok });
      if (res.ok) { setOldEmail(""); setNewEmail(""); setEmailPassword(""); }
    } catch {
      setEmailMsg({ text: "An error occurred. Please try again.", ok: false });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-4 py-10">
      <div className="mx-auto max-w-lg space-y-8">

        <div className="flex items-center gap-3">
          <a href="/" className="text-sm text-[#4a7c9f] hover:underline">← Back to portal</a>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Account Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Signed in as <span className="font-semibold">{currentUsername}</span></p>
        </div>

        {/* Change Phone */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Change Phone Number</h2>
          {phoneMsg && (
            <div className={`mb-4 rounded-xl p-3 text-sm border ${phoneMsg.ok ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-100"}`}>
              {phoneMsg.text}
            </div>
          )}
          <form onSubmit={handleChangePhone} className="space-y-4">
            <FormField label="Current Phone Number" type="tel" value={oldPhone} onChange={setOldPhone} placeholder="e.g., 0771234567" disabled={phoneLoading} />
            <FormField label="New Phone Number" type="tel" value={newPhone} onChange={setNewPhone} placeholder="e.g., 0779876543" disabled={phoneLoading} />
            <FormField label="Current Password" type="password" value={phonePassword} onChange={setPhonePassword} placeholder="Your account password" disabled={phoneLoading} />
            <button
              type="submit"
              disabled={phoneLoading}
              className="flex w-full justify-center rounded-full bg-[#4a7c9f] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#3b6787] disabled:opacity-70 transition-all duration-200"
            >
              {phoneLoading ? "Updating..." : "Update Phone Number"}
            </button>
          </form>
        </section>

        {/* Change Email */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Change Email Address</h2>
          {emailMsg && (
            <div className={`mb-4 rounded-xl p-3 text-sm border ${emailMsg.ok ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-100"}`}>
              {emailMsg.text}
            </div>
          )}
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <FormField label="Current Email Address" type="email" value={oldEmail} onChange={setOldEmail} placeholder="your@current-email.com" disabled={emailLoading} />
            <FormField label="New Email Address" type="email" value={newEmail} onChange={setNewEmail} placeholder="your@new-email.com" disabled={emailLoading} />
            <FormField label="Current Password" type="password" value={emailPassword} onChange={setEmailPassword} placeholder="Your account password" disabled={emailLoading} />
            <button
              type="submit"
              disabled={emailLoading}
              className="flex w-full justify-center rounded-full bg-[#4a7c9f] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#3b6787] disabled:opacity-70 transition-all duration-200"
            >
              {emailLoading ? "Updating..." : "Update Email Address"}
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}

function FormField({
  label, value, onChange, placeholder, type = "text", disabled,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required
        placeholder={placeholder}
        className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#4a7c9f] disabled:opacity-50 sm:text-sm transition-all"
      />
    </div>
  );
}
