"use client";

import { SettingsForm } from "@/components/settings/settings-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, Bell, Lock, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs value="general" onValueChange={(value) => console.log(`Tab changed to ${value}`)} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Privacy</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <SettingsForm />
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which notifications you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Notification preferences are managed in the General settings tab. You can enable or disable all notifications there.
              </p>
              <p className="text-sm text-muted-foreground">
                More granular notification controls will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Security settings are managed through your authentication provider.
              </p>
              <p className="text-sm text-muted-foreground">
                You can change your password, enable two-factor authentication, and manage other security settings through your account settings.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Manage your privacy settings and data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your data is stored securely and is only accessible to you.
              </p>
              <p className="text-sm text-muted-foreground">
                We do not share your data with third parties without your explicit consent.
              </p>
              <p className="text-sm text-muted-foreground">
                More privacy controls will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
