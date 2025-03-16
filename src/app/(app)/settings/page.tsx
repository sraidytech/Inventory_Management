"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SettingsForm } from "@/components/settings/settings-form";
import { PasswordForm } from "@/components/settings/password-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, Lock, Shield } from "lucide-react";
import { TranslatedText } from "@/components/language/translated-text";
import { useLanguage } from "@/components/language/language-provider";

export default function SettingsPage() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("general");
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check if there's a tab parameter in the URL
    const tab = searchParams.get("tab");
    if (tab === "security") {
      setActiveTab("security");
    }
  }, [searchParams]);
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <TranslatedText namespace="settings" id="title" />
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "ar" ? "إدارة إعدادات التطبيق والتفضيلات الشخصية" : "Manage application settings and personal preferences"}
        </p>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="mb-8">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span><TranslatedText namespace="settings" id="account" /></span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span><TranslatedText namespace="settings" id="security" /></span>
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span><TranslatedText namespace="settings" id="about" /></span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <SettingsForm />
        </TabsContent>

        <TabsContent value="security">
          <PasswordForm />
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle><TranslatedText namespace="settings" id="about" /></CardTitle>
              <CardDescription>
                {language === "ar" ? "معلومات حول النظام" : "Information about the system"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {language === "ar" 
                  ? "نظام إدارة المخزون هو تطبيق شامل لإدارة المخزون والمبيعات والمشتريات وتتبع العملاء والموردين." 
                  : "Inventory Management System is a comprehensive application for managing inventory, sales, purchases, and tracking clients and suppliers."}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === "ar" 
                  ? "الإصدار: 1.0.0" 
                  : "Version: 1.0.0"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
