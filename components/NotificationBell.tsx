"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getUnreadNotifications } from "@/lib/api";

export function NotificationBell() {
  const { currentRole, currentUserId } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only fetch if we have a valid role and ID that needs notifications
    if (!currentUserId || !["REGISTRAR", "FAMILY"].includes(currentRole)) return;

    let mounted = true;

    const fetchNotifications = async () => {
      try {
        const data = await getUnreadNotifications(currentUserId, currentRole);
        if (mounted) {
          setUnreadCount(data.unreadCount || 0);
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();

    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchNotifications, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currentRole, currentUserId]);

  if (!["REGISTRAR", "FAMILY"].includes(currentRole)) {
    return null; // Do not show bell for guests or roles without notifications
  }

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            <div className="block px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-100">
              Notifications
            </div>
            {messages.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">No new notifications.</div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50">
                  {msg}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
