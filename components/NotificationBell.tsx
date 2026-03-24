"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { getUnreadNotifications } from "../lib/api";

interface NotificationData {
  unreadCount: number;
  messages: string[];
  formIds: number[];
}

export function NotificationBell() {
  const { currentRole, currentUsername, currentNicNo } = useAuth();
  const [data, setData] = useState<NotificationData | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only fetch if we have a valid role that needs notifications
    if (!["REGISTRAR", "FAMILY", "GRAMA_NILADHARI"].includes(currentRole)) return;
    if (!currentUsername && !currentNicNo) return;

    let mounted = true;

    const fetchNotifications = async () => {
      try {
        const result = await getUnreadNotifications(
          currentUsername || "",
          currentNicNo || "",
          currentRole
        );
        if (mounted) setData(result);
      } catch {
        // Silently ignore notification fetch errors — non-critical
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currentRole, currentUsername, currentNicNo]);

  if (!["REGISTRAR", "FAMILY", "GRAMA_NILADHARI"].includes(currentRole)) {
    return null;
  }

  const handleNotificationClick = (index: number) => {
    if (currentRole === "REGISTRAR" && data?.formIds && data.formIds[index]) {
      router.push(`/registrar/review-b24/${data.formIds[index]}`);
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {data && data.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
            {data.unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {data && data.messages.length > 0 ? (
              data.messages.map((msg, i) => (
                <button
                  key={i}
                  onClick={() => handleNotificationClick(i)}
                  className={`w-full text-left p-3 text-sm border-b border-gray-50 last:border-b-0 transition-colors ${
                    currentRole === "REGISTRAR" && data.formIds?.[i]
                      ? "hover:bg-blue-50 cursor-pointer text-blue-700"
                      : "text-gray-700 cursor-default"
                  }`}
                >
                  <span className="block">{msg}</span>
                  {currentRole === "REGISTRAR" && data.formIds?.[i] && (
                    <span className="text-xs text-blue-500 mt-1 block">Click to review →</span>
                  )}
                </button>
              ))
            ) : (
              <div className="p-4 text-sm text-gray-500 text-center">
                No new notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
