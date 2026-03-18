"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/auth-context";
import { getTrackingInfo } from "../lib/api";
import Link from "next/link";

interface TrackingItem {
  formId: number;
  formType: string;
  currentStage: string;
  updatedAt: string;
  submittedAt: string;
  deceasedName: string;
}

const stageLabels: Record<string, string> = {
  SUBMITTED_BY_GN: "Submitted by GN",
  REVIEW_BY_REGISTRAR: "Under Registrar Review",
  APPROVED: "Approved",
  READY_FOR_PICKUP: "Ready for Pickup",
};

const stageColors: Record<string, string> = {
  SUBMITTED_BY_GN: "bg-yellow-100 text-yellow-800",
  REVIEW_BY_REGISTRAR: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  READY_FOR_PICKUP: "bg-purple-100 text-purple-800",
};

export function FormTracker() {
  const { currentNicNo } = useAuth();
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentNicNo) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const data = await getTrackingInfo(currentNicNo);
        setItems(data);
      } catch (err) {
        setError("Failed to load your forms. Please try again later.");
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">Loading your forms...</p>
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
        <h2 className="text-lg font-semibold text-gray-900">Your Linked Forms</h2>
        <p className="text-sm text-gray-500 mt-1">
          Showing forms linked to NIC: <span className="font-mono font-medium text-gray-700">{currentNicNo}</span>
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">No forms have been linked to your NIC yet.</p>
          <p className="text-xs text-gray-400 mt-1">Once a Grama Niladhari submits a B24 report with your NIC, it will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Form</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Deceased / Record</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Submitted</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Last Updated</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={`${item.formType}-${item.formId}`} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-medium text-gray-800">{item.formType}</span>
                    <span className="text-gray-400 ml-1">#{item.formId}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{item.deceasedName}</td>
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                    {item.submittedAt ? new Date(item.submittedAt).toLocaleString("en-LK", {
                      year: "numeric", month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    }) : "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleString("en-LK", {
                      year: "numeric", month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    }) : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${stageColors[item.currentStage] || "bg-gray-100 text-gray-700"}`}>
                      {stageLabels[item.currentStage] || item.currentStage}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {item.formType === "CR02" && (
                      <Link
                        href={`/family/view-cr02/${item.formId}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-md bg-blue-50"
                      >
                        View Form
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
