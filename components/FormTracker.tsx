"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getTrackingInfo } from "@/lib/api";
import { FileText, Search, CheckCircle2, Package } from "lucide-react";

interface TrackingRecord {
  formId: number;
  formType: string;
  currentStage: string;
  updatedAt: string;
  submittedAt: string;
  deceasedName: string;
}

export function FormTracker() {
  const { currentRole, currentUserId } = useAuth();
  const [trackingRecords, setTrackingRecords] = useState<TrackingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentRole !== "FAMILY" || !currentUserId) return;

    let mounted = true;

    const fetchTracking = async () => {
      try {
        const data = await getTrackingInfo(currentUserId);
        if (mounted) {
          setTrackingRecords(data);
        }
      } catch (err) {
        console.error("Failed to fetch tracking data", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchTracking();
    const interval = setInterval(fetchTracking, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currentRole, currentUserId]);

  if (currentRole !== "FAMILY") return null;

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading tracking information...</div>;
  }

  if (trackingRecords.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
        No active documents found linked to your account.
      </div>
    );
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "SUBMITTED_BY_GN": return <FileText className="w-5 h-5 text-blue-500" />;
      case "REVIEW_BY_REGISTRAR": return <Search className="w-5 h-5 text-purple-500" />;
      case "APPROVED": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "READY_FOR_PICKUP": return <Package className="w-5 h-5 text-orange-500" />;
      default: return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStageTitle = (stage: string) => {
    switch (stage) {
      case "SUBMITTED_BY_GN": return "Submitted by GN";
      case "REVIEW_BY_REGISTRAR": return "Review by Registrar";
      case "APPROVED": return "Approved";
      case "READY_FOR_PICKUP": return "Ready for Pickup";
      default: return stage;
    }
  };

  const getStageDescription = (stage: string) => {
    switch (stage) {
      case "SUBMITTED_BY_GN": return "The Grama Niladhari has submitted the document to the system.";
      case "REVIEW_BY_REGISTRAR": return "The Registrar is currently reviewing the document details.";
      case "APPROVED": return "The application has been finalized and approved.";
      case "READY_FOR_PICKUP": return "The physical certificate is ready for pickup at the Divisional Secretariat.";
      default: return "Unknown status";
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Your Document Status</h2>
      <div className="space-y-4">
        {trackingRecords.map((record) => (
          <div key={`${record.formType}-${record.formId}`} className="p-5 bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#1e3a5f]">{record.formType} Form</h3>
                <p className="text-sm text-gray-500">Deceased: {record.deceasedName}</p>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>Submitted: {new Date(record.submittedAt).toLocaleDateString()}</p>
                <p>Updated: {new Date(record.updatedAt).toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Visual Timeline element */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-4">
              <div className="mt-1 p-2 bg-gray-50 rounded-full border border-gray-100">
                {getStageIcon(record.currentStage)}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{getStageTitle(record.currentStage)}</h4>
                <p className="text-sm text-gray-600 mt-1">{getStageDescription(record.currentStage)}</p>
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
