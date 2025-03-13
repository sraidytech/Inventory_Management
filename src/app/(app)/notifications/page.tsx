"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Check, Trash2, ExternalLink, Filter } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TranslatedText } from "@/components/language/translated-text";
import { useLanguage } from "@/components/language/language-provider";

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

export default function NotificationsPage() {
  const { isRTL } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NotificationStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "ALL">("ALL");

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (activeTab !== "ALL") {
        params.append("status", activeTab);
      }
      if (typeFilter !== "ALL") {
        params.append("type", typeFilter);
      }
      
      const response = await fetch(`/api/notifications?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache: 'no-store' to prevent caching
        cache: 'no-store',
      });

      const data = await response.json();
      console.log("Fetched notifications:", data);
      console.log("Raw data:", JSON.stringify(data));
      
      if (data.success) {
        // The API middleware wraps the response in another data property
        // So we need to check if data.data.data exists (double nested)
        if (data.data && data.data.success && data.data.data) {
          console.log("Double nested data structure detected");
          
          // Handle double nested structure (from middleware)
          const nestedData = data.data.data;
          
          if (Array.isArray(nestedData)) {
            console.log("Nested data is an array, length:", nestedData.length);
            setNotifications(nestedData);
          } else if (nestedData.items && Array.isArray(nestedData.items)) {
            console.log("Nested data has items array, length:", nestedData.items.length);
            setNotifications(nestedData.items);
          } else {
            console.log("No notifications found in nested data");
            setNotifications([]);
          }
        } 
        // Handle single nested structure (direct from API)
        else if (Array.isArray(data.data)) {
          console.log("Data is an array, length:", data.data.length);
          setNotifications(data.data);
        } else if (data.data && data.data.items && Array.isArray(data.data.items)) {
          console.log("Data has items array, length:", data.data.items.length);
          setNotifications(data.data.items);
        } else {
          // Handle case when items array is not available
          console.log("No notifications found or invalid data format");
          console.log("Data structure:", typeof data.data, data.data ? Object.keys(data.data) : "null");
          setNotifications([]);
        }
      } else {
        console.log("API request failed:", data.error || "Unknown error");
        setNotifications([]);
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
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Archive a notification
  const archiveNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });

      if (response.ok) {
        // Update local state
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error archiving notification:", error);
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
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Fetch notifications when tab or filter changes
  useEffect(() => {
    fetchNotifications();
  }, [activeTab, typeFilter]);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "PPP p"); // e.g., "Apr 29, 2021, 5:34 PM"
    } catch {
      return dateString;
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "STOCK_ALERT":
        return <div className="w-3 h-3 rounded-full bg-red-500" />;
      case "PAYMENT_DUE":
        return <div className="w-3 h-3 rounded-full bg-amber-500" />;
      case "PAYMENT_RECEIVED":
        return <div className="w-3 h-3 rounded-full bg-green-500" />;
      case "SYSTEM":
        return <div className="w-3 h-3 rounded-full bg-blue-500" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-500" />;
    }
  };

  // Get notification type translation key
  const getNotificationTypeKey = (type: NotificationType) => {
    switch (type) {
      case "STOCK_ALERT":
        return "stockAlert";
      case "PAYMENT_DUE":
        return "paymentDue";
      case "PAYMENT_RECEIVED":
        return "paymentReceived";
      case "SYSTEM":
        return "system";
      default:
        return "system";
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            <TranslatedText namespace="notifications" id="title" />
          </h1>
          <p className="text-muted-foreground mt-2">
            <TranslatedText namespace="notifications" id="description" />
          </p>
        </div>
        {notifications.length > 0 && activeTab === "UNREAD" && (
          <Button 
            variant="outline" 
            onClick={markAllAsRead}
            className="flex items-center gap-2"
          >
            <Check className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            <TranslatedText namespace="notifications" id="markAllAsRead" />
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle><TranslatedText namespace="notifications" id="title" /></CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as NotificationType | "ALL")}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder={<TranslatedText namespace="common" id="filter" />} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL"><TranslatedText namespace="common" id="all" /></SelectItem>
                  <SelectItem value="STOCK_ALERT"><TranslatedText namespace="notifications.types" id="stockAlert" /></SelectItem>
                  <SelectItem value="PAYMENT_DUE"><TranslatedText namespace="notifications.types" id="paymentDue" /></SelectItem>
                  <SelectItem value="PAYMENT_RECEIVED"><TranslatedText namespace="notifications.types" id="paymentReceived" /></SelectItem>
                  <SelectItem value="SYSTEM"><TranslatedText namespace="notifications.types" id="system" /></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardDescription>
            <TranslatedText namespace="notifications" id="unreadCount" /> {notifications.filter(n => n.status === "UNREAD").length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as NotificationStatus | "ALL")}
            className="w-full"
          >
            <TabsList className="mb-6 grid grid-cols-4 w-full">
              <TabsTrigger value="ALL"><TranslatedText namespace="common" id="all" /></TabsTrigger>
              <TabsTrigger value="UNREAD"><TranslatedText namespace="notifications.status" id="unread" /></TabsTrigger>
              <TabsTrigger value="READ"><TranslatedText namespace="notifications.status" id="read" /></TabsTrigger>
              <TabsTrigger value="ARCHIVED"><TranslatedText namespace="notifications.status" id="archived" /></TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground"><TranslatedText namespace="common" id="loading" /></p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground"><TranslatedText namespace="notifications" id="noNotifications" /></p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-4 hover:bg-muted rounded-md transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1.5">{getNotificationIcon(notification.type)}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{notification.title}</h3>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted-foreground/20 text-muted-foreground">
                                <TranslatedText namespace="notifications.types" id={getNotificationTypeKey(notification.type)} />
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground/70 mt-2">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {notification.link && (
                            <Link href={notification.link}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {notification.status === "UNREAD" && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {notification.status !== "ARCHIVED" && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => archiveNotification(notification.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
