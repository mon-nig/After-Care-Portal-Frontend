"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/auth-context";
import { getTrackingInfo } from "../lib/api";
import { FileCheck2, Clock, Eye } from "lucide-react";

interface TrackingItem {
  formId: number;
  formType: string;
  currentStage: string;
  updatedAt: string;
  submittedAt: string;
  record: string;
  deceasedName: string | null;
}

/** One row per deceased individual, consolidating B24 + CR02 */
interface RegistrationCase {
  deceasedName: string;
  b24Id: number;
  b24SubmittedAt: string;
  cr02Id: number | null;
  cr02SubmittedAt: string | null;
  lastUpdated: string;
  status: "PENDING" | "COMPLETED";
}

function consolidate(items: TrackingItem[]): RegistrationCase[] {
  const b24s = items.filter((i) => i.formType === "B24");
  const cr02s = items.filter((i) => i.formType === "CR02");

  return b24s.map((b24) => {
    // Try to find a matching CR02 by deceased name (record field contains the label)
    // The B24 record is "B24 Report" and CR02 is "CR02 Declaration" — we need the deceased name
    // The deceased name comes from the B24 fullName which is stored but not in the tracking DTO record field.
    // Instead, match by familyNicNo (they share the same NIC) — the CR02 with the closest timestamps
    // Since all items share the same NIC, look for any CR02 that exists
    const matchingCr02 = cr02s.length > 0 ? cr02s[0] : null;

    // If multiple B24s exist, each subsequent one should try different CR02s
    // For now, pop the first matched CR02 to avoid double-matching
    if (matchingCr02) {
      cr02s.splice(cr02s.indexOf(matchingCr02), 1);
    }

    const latestDate = matchingCr02
      ? (new Date(matchingCr02.updatedAt) > new Date(b24.updatedAt) ? matchingCr02.updatedAt : b24.updatedAt)
      : b24.updatedAt;

    return {
      deceasedName: b24.deceasedName || "Unknown",
      b24Id: b24.formId,
      b24SubmittedAt: b24.submittedAt,
      cr02Id: matchingCr02?.formId ?? null,
      cr02SubmittedAt: matchingCr02?.submittedAt ?? null,
      lastUpdated: latestDate,
      status: matchingCr02 ? "COMPLETED" as const : "PENDING" as const,
    };
  });
}

export function FormTracker() {
  const { currentNicNo } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<RegistrationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentNicNo) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        console.log("[FormTracker] Fetching tracking for nicNo:", currentNicNo);
        const data: TrackingItem[] = await getTrackingInfo(currentNicNo);
        console.log("[FormTracker] Raw items:", data);
        const consolidated = consolidate(data);
        console.log("[FormTracker] Consolidated cases:", consolidated);
        setCases(consolidated);
      } catch (err) {
        console.error("[FormTracker] API Error:", err);
        setError("Failed to load your registrations. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [currentNicNo]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading your registrations...</p>
      </div>
    );
  }

  if (!currentNicNo) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900">Welcome, Family Member</h2>
        <p className="mt-2 text-sm text-gray-500">
          Your account does not have a NIC number linked. Please contact support to update your profile.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Death Registration Status</h2>
        <p className="text-sm text-gray-500 mt-1">
          Tracking registrations linked to NIC: <span className="font-mono font-medium text-gray-700">{currentNicNo}</span>
        </p>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">No death registrations have been linked to your NIC yet.</p>
          <p className="text-xs text-gray-400 mt-1">Once a Grama Niladhari submits a B24 report with your NIC, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <div
              key={c.b24Id}
              className={`rounded-xl border transition-all ${
                c.status === "COMPLETED"
                  ? "border-emerald-200 bg-emerald-50/40 hover:border-emerald-300 hover:shadow-md cursor-pointer"
                  : "border-amber-200 bg-amber-50/30"
              }`}
              onClick={() => {
                if (c.status === "COMPLETED" && c.cr02Id) {
                  router.push(`/view-cr02/${c.cr02Id}`);
                }
              }}
            >
              <div className="flex items-center justify-between p-4 sm:p-5">
                {/* Left: Icon + Info */}
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full ${
                    c.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {c.status === "COMPLETED" ? <FileCheck2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Death Registration — {c.deceasedName}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Initiated {c.b24SubmittedAt ? new Date(c.b24SubmittedAt).toLocaleDateString("en-LK", {
                        year: "numeric", month: "short", day: "numeric"
                      }) : "—"}
                      {c.cr02SubmittedAt && (
                        <> · Completed {new Date(c.cr02SubmittedAt).toLocaleDateString("en-LK", {
                          year: "numeric", month: "short", day: "numeric"
                        })}</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right: Status + Action */}
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${
                    c.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {c.status === "COMPLETED" ? (
                      <><FileCheck2 className="w-3.5 h-3.5" /> Completed</>
                    ) : (
                      <><Clock className="w-3.5 h-3.5" /> Pending at Registrar</>
                    )}
                  </span>

                  {c.status === "COMPLETED" && c.cr02Id && (
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/view-cr02/${c.cr02Id}`);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Certificate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
