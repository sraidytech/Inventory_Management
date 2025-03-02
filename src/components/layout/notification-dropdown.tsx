"use client";

import { useState, useEffect } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

// Define notification types
type NotificationType = "STOCK_ALERT" | "PAYMENT_DUE" | "PAYMENT_RECEIVED" | "SYSTEM";
type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  link?: string;
  createdAt: string;
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications?status=UNREAD", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data.items)) {
        setNotifications(data.data.items);
        setUnreadCount(data.data.items.length);
      } else {
        // Handle case when items array is not available
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "READ" }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.filter(n => n.id !== id));
        setUnreadCount(prev => prev - 1);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE", // Using DELETE as it's set up to mark all as read
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Update local state
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Fetch notifications on initial load and when popover opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  // Fetch unread count periodically
  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications every minute
    const interval = setInterval(() => {
      if (!open) { // Only poll when dropdown is closed
        fetchNotifications();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Format date to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "STOCK_ALERT":
        return <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />;
      case "PAYMENT_DUE":
        return <div className="w-2 h-2 rounded-full bg-amber-500 mr-2" />;
      case "PAYMENT_RECEIVED":
        return <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />;
      case "SYSTEM":
        return <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-500 mr-2" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-medium">Notifications</h3>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="h-8 px-2 text-xs"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No new notifications
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div key={notification.id} className="border-b last:border-b-0">
                  <div className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        {getNotificationIcon(notification.type)}
                        <div>
                          <h4 className="text-sm font-medium">{notification.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {notification.link && (
                          <Link href={notification.link}>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Separator />
        <div className="p-2">
          <Link href="/notifications">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View all notifications
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
