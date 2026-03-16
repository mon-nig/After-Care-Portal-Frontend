"use client";

import { useEffect, useState } from "react";
import { X, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { fetchGnHistory, fetchRegistrarHistory, fetchB24ById, fetchCr02ById } from "../lib/api";

interface TrackingItem {
  formId: number;
  formType: string;
  currentStage: string;
  updatedAt: string;
  submittedAt: string;
  record: string;
}

interface RecordHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: "GN" | "REGISTRAR";
  username: string;
}

const stageLabels: Record<string, string> = {
  SUBMITTED_BY_GN: "Submitted",
  SUBMITTED_BY_REGISTRAR: "Submitted",
  REVIEW_BY_REGISTRAR: "Under Review",
  APPROVED: "Approved",
  COMPLETED: "Completed",
  READY_FOR_PICKUP: "Ready",
};

const stageColors: Record<string, string> = {
  SUBMITTED_BY_GN: "bg-yellow-100 text-yellow-800",
  SUBMITTED_BY_REGISTRAR: "bg-indigo-100 text-indigo-800",
  REVIEW_BY_REGISTRAR: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  READY_FOR_PICKUP: "bg-purple-100 text-purple-800",
};

export function RecordHistoryModal({ isOpen, onClose, role, username }: RecordHistoryModalProps) {
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailType, setDetailType] = useState<"B24" | "CR02" | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setDetail(null);
    setDetailType(null);

    const fetchData = role === "GN" ? fetchGnHistory : fetchRegistrarHistory;
    console.log(`[RecordHistoryModal] Fetching ${role} history for username:`, username);
    fetchData(username)
      .then((data) => { console.log("[RecordHistoryModal] Received data:", data); setItems(data); })
      .catch((err) => { console.error("[RecordHistoryModal] API Error:", err); setError("Failed to load history."); })
      .finally(() => setLoading(false));
  }, [isOpen, role, username]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openDetail = async (item: TrackingItem) => {
    setDetailLoading(true);
    try {
      const data = item.formType === "B24"
        ? await fetchB24ById(item.formId)
        : await fetchCr02ById(item.formId);
      setDetail(data);
      setDetailType(item.formType as "B24" | "CR02");
    } catch {
      setError("Failed to load record details.");
    } finally {
      setDetailLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/60 bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="flex items-center gap-3">
            {detail && (
              <button
                onClick={() => { setDetail(null); setDetailType(null); }}
                className="p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors"
              >
                <ArrowLeft className="size-4 text-gray-600" />
              </button>
            )}
            <FileText className="size-5 text-[#4a7c9f]" />
            <h2 className="text-lg font-semibold text-gray-900">
              {detail ? `${detailType} Record #${detail.id}` : "Record History"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200/70 transition-colors"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading || detailLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="size-7 animate-spin text-[#4a7c9f]" />
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          ) : detail ? (
            <ReadOnlyDetail data={detail} type={detailType!} />
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="size-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No records found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <button
                  key={`${item.formType}-${item.formId}`}
                  onClick={() => openDetail(item)}
                  className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-[#4a7c9f]/30 hover:bg-blue-50/30 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-semibold text-gray-800 text-sm">{item.formType}</span>
                      <span className="text-gray-400 ml-1 text-sm">#{item.formId}</span>
                      <span className="text-gray-300 mx-2">·</span>
                      <span className="text-gray-500 text-sm">{item.record}</span>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stageColors[item.currentStage] || "bg-gray-100 text-gray-600"}`}>
                      {stageLabels[item.currentStage] || item.currentStage}
                    </span>
                  </div>
                  {item.submittedAt && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      {new Date(item.submittedAt).toLocaleString("en-LK", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ReadOnlyDetail({ data, type }: { data: any; type: "B24" | "CR02" }) {
  const fields = type === "B24" ? [
    { label: "Grama Division", value: data.gramaDivision },
    { label: "Registrar Division", value: data.registrarDivision },
    { label: "Serial No", value: data.serialNo },
    { label: "Date of Death", value: data.deathYear ? `${data.deathYear}-${String(data.deathMonth).padStart(2,"0")}-${String(data.deathDay).padStart(2,"0")}` : "" },
    { label: "Place of Death", value: data.placeOfDeath },
    { label: "Full Name of Deceased", value: data.fullName },
    { label: "Sex", value: data.sex },
    { label: "Race", value: data.race },
    { label: "Age", value: data.age },
    { label: "Profession", value: data.profession },
    { label: "Cause of Death", value: data.causeOfDeath },
    { label: "Informant Name", value: data.informantName },
    { label: "Informant Address", value: data.informantAddress },
    { label: "Family NIC", value: data.familyNicNo },
    { label: "Status", value: data.currentStage },
  ] : [
    { label: "Type of Death", value: data.typeOfDeath },
    { label: "Date of Death", value: data.deathYear ? `${data.deathYear}-${String(data.deathMonth).padStart(2,"0")}-${String(data.deathDay).padStart(2,"0")}` : "" },
    { label: "District", value: data.district },
    { label: "DS Division", value: data.dsDivision },
    { label: "Registration Division", value: data.regDivision },
    { label: "Place (English)", value: data.placeInEnglish },
    { label: "Cause of Death", value: data.causeOfDeath },
    { label: "ICD Code", value: data.icdCode },
    { label: "Burial Place", value: data.burialPlace },
    { label: "Informant Name", value: data.informantName },
    { label: "Informant Address", value: data.informantAddress },
    { label: "Deceased Name", value: data.deceasedName },
    { label: "Family NIC", value: data.familyNicNo },
    { label: "Status", value: data.currentStage },
  ];

  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-700">
          {type === "B24" ? "B24 — Report of Death" : "CR02 — Death Declaration"}
        </h3>
      </div>
      {fields.map((f) => (
        <div key={f.label} className="flex px-5 py-3">
          <span className="w-2/5 text-sm font-medium text-gray-500">{f.label}</span>
          <span className="w-3/5 text-sm text-gray-900">{f.value || "—"}</span>
        </div>
      ))}
    </div>
  );
}
